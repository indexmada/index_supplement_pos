# -*- coding: utf-8 -*-
from odoo import models, api, fields, _
from odoo.exceptions import UserError
from odoo.tools import float_is_zero

class PosOrder(models.Model):
    _inherit = 'pos.order'

    accompaniment_ids = fields.Many2many('pos.accompaniment.line', string='Accompagnements', compute="_compute_accompaniment_ids")
    picking_accompaniment_id = fields.Many2one('stock.picking', string='Accompaniment Picking', copy=False)

    @api.depends('lines')
    def _compute_accompaniment_ids(self):
        """
        Compute method to aggregate all accompaniment_ids from related order lines
        and set them on the pos.order record.
        """
        for order in self:
            for line in order.lines:
                order.accompaniment_ids |= line.accompaniment_ids

    @api.model
    def _process_order(self, pos_order):
        """Override to process custom fields and create a stock picking for accompaniments."""

        # Determine the picking type for the new picking
        picking_type = self.env['stock.picking.type'].search([('code', '=', 'outgoing')], limit=1)
        if not picking_type:
            raise UserError('No outgoing picking type found.')

        # Get the source and destination locations
        location_id = picking_type.default_location_src_id.id
        dest_location_id = self.env.ref('stock.stock_location_customers').id

        # Iterate over each order line to handle accompaniments
        for line_data in pos_order['lines']:
            line = line_data[2]  # Order line data dictionary
            new_acc = []
            accompaniments = line.get('accompaniment_ids', [])

            # Process each accompaniment
            for acc in accompaniments:
                del acc['line_id']  # Remove line_id to avoid conflicts

                # Append the accompaniment to new_acc with status 'done'
                new_acc.append((0, 0, {**acc, 'status': 'done'}))

            # Update line dictionary with new accompaniments
            line['accompaniment_ids'] = new_acc

        # Call the super method to process the order
        order = super(PosOrder, self)._process_order(pos_order)

        return order

    @api.model
    def create_from_ui(self, orders):
        order_ids = super(PosOrder, self).create_from_ui(orders)

        orders = self.env['pos.order'].browse(order_ids)
        orders.create_acc_picking_type()
        return order_ids

    def create_acc_picking_type(self):
        """Create a picking for each order and validate it."""
        Picking = self.env['stock.picking']
        # If no email is set on the user, the picking creation and validation will fail be cause of
        # the 'Unable to log message, please configure the sender's email address.' error.
        # We disable the tracking in this case.
        if not self.env.user.partner_id.email:
            Picking = Picking.with_context(tracking_disable=True)
        Move = self.env['stock.move']
        StockWarehouse = self.env['stock.warehouse']
        for order in self:
            if order:
                lines = order.lines.mapped('accompaniment_ids')
                if not lines.filtered(lambda l: l.product_id.type in ['product', 'consu']):
                    continue
                address = order.partner_id.address_get(['delivery']) or {}
                picking_type = order.picking_type_id
                return_pick_type = order.picking_type_id.return_picking_type_id or order.picking_type_id
                order_picking = Picking
                return_picking = Picking
                moves = Move
                location_id = order.location_id.id
                if order.partner_id:
                    destination_id = order.partner_id.property_stock_customer.id
                else:
                    if (not picking_type) or (not picking_type.default_location_dest_id):
                        customerloc, supplierloc = StockWarehouse._get_partner_locations()
                        destination_id = customerloc.id
                    else:
                        destination_id = picking_type.default_location_dest_id.id

                if picking_type:
                    message = _("This transfer has been created from the point of sale session: <a href=# data-oe-model=pos.order data-oe-id=%d>%s</a>") % (order.id, order.name)
                    picking_vals = {
                        'origin': order.name,
                        'partner_id': address.get('delivery', False),
                        'date_done': order.date_order,
                        'picking_type_id': picking_type.id,
                        'company_id': order.company_id.id,
                        'move_type': 'direct',
                        'note': order.note or "",
                        'location_id': location_id,
                        'location_dest_id': destination_id,
                    }
                    pos_qty = any([x.quantity > 0 for x in lines if x.product_id.type in ['product', 'consu']])
                    if pos_qty:
                        order_picking = Picking.create(picking_vals.copy())
                        if self.env.user.partner_id.email:
                            order_picking.message_post(body=message)
                        else:
                            order_picking.sudo().message_post(body=message)
                    neg_qty = any([x.quantity < 0 for x in lines if x.product_id.type in ['product', 'consu']])
                    if neg_qty:
                        return_vals = picking_vals.copy()
                        return_vals.update({
                            'location_id': destination_id,
                            'location_dest_id': return_pick_type != picking_type and return_pick_type.default_location_dest_id.id or location_id,
                            'picking_type_id': return_pick_type.id
                        })
                        return_picking = Picking.create(return_vals)
                        if self.env.user.partner_id.email:
                            return_picking.message_post(body=message)
                        else:
                            return_picking.sudo().message_post(body=message)

                for line in lines.filtered(lambda l: l.product_id.type in ['product', 'consu'] and not float_is_zero(l.quantity, precision_rounding=l.product_id.uom_id.rounding)):
                    moves |= Move.create({
                        'name': line.name,
                        'product_uom': line.product_id.uom_id.id,
                        'picking_id': order_picking.id if line.quantity >= 0 else return_picking.id,
                        'picking_type_id': picking_type.id if line.quantity >= 0 else return_pick_type.id,
                        'product_id': line.product_id.id,
                        'product_uom_qty': abs(line.quantity),
                        'state': 'draft',
                        'location_id': location_id if line.quantity >= 0 else destination_id,
                        'location_dest_id': destination_id if line.quantity >= 0 else return_pick_type != picking_type and return_pick_type.default_location_dest_id.id or location_id,
                    })

                # prefer associating the regular order picking, not the return
                order.write({'picking_accompaniment_id': order_picking.id or return_picking.id})

                if return_picking:
                    order._force_picking_done(return_picking)
                if order_picking:
                    order._force_picking_done(order_picking)

                # when the pos.config has no picking_type_id set only the moves will be created
                if moves and not return_picking and not order_picking:
                    moves._action_assign()
                    moves.filtered(lambda m: m.product_id.tracking == 'none')._action_done()

        return True