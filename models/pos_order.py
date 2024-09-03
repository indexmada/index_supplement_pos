# -*- coding: utf-8 -*-

from odoo import models, api, fields
from odoo.exceptions import UserError

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

        # Create a new stock picking for the accompaniments
        picking_vals = {
            'partner_id': order.partner_id.id,
            'picking_type_id': picking_type.id,
            'location_id': location_id,
            'location_dest_id': dest_location_id,
            'origin': order.name,
            'move_type': 'direct',  # Set to 'direct' or 'one' depending on your need
        }
        accompaniment_picking = self.env['stock.picking'].create(picking_vals)

        # Create stock moves for each accompaniment in the picking
        move_lines = []
        for line in order.lines:
            for acc in line.accompaniment_ids:
                product = acc.product_id
                if product.type == 'product':  # Ensure the product is storable
                    move_vals = {
                        'name': product.name,
                        'product_id': product.id,
                        'product_uom_qty': acc.quantity,
                        'quantity_done': acc.quantity,
                        'product_uom': product.uom_id.id,
                        'location_id': location_id,
                        'location_dest_id': dest_location_id,
                        'picking_id': accompaniment_picking.id,  # Link move to the picking
                        'state': 'draft',  # Initial state of the move
                    }
                    move_lines.append((0, 0, move_vals))

        # Add all stock moves to the picking
        accompaniment_picking.move_lines = move_lines

        # Confirm and validate the picking to create stock moves
        accompaniment_picking.action_confirm()
        accompaniment_picking.action_assign()
        accompaniment_picking.button_validate()

        order.picking_accompaniment_id = accompaniment_picking.id
        return order
