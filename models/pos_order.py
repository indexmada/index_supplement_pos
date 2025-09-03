# -*- coding: utf-8 -*-

from odoo import models, api, fields, _
from odoo.exceptions import UserError


class PosOrder(models.Model):
    _inherit = 'pos.order'
    
    # Computed fields
    total_accompaniment_amount = fields.Float(
        string='Total Accompaniment Amount',
        compute='_compute_total_accompaniment_amount',
        store=True
    )
    
    picking_accompaniment_id = fields.Many2one(
        'stock.picking', 
        string='Accompaniment Picking', 
        copy=False
    )
    
    def get_accompaniment_ids(self):
        """Get all accompaniment lines from related order lines"""
        accompaniments = self.env['pos.accompaniment.line']
        for line in self.lines:
            accompaniments |= line.accompaniment_ids
        return accompaniments
    
    @api.depends('lines', 'lines.accompaniment_total')
    def _compute_total_accompaniment_amount(self):
        """Compute the total amount of all accompaniments in the order"""
        for order in self:
            order.total_accompaniment_amount = sum(
                line.accompaniment_total for line in order.lines
            )
    
    @api.model
    def _process_order(self, order, draft=False, existing_order=None):
        """Override to process accompaniments in order data"""
        # Process accompaniments in order lines
        if 'lines' in order:
            for line_data in order['lines']:
                if isinstance(line_data, (list, tuple)) and len(line_data) > 2:
                    line_values = line_data[2]
                    if 'accompaniment_ids' in line_values:
                        # Process accompaniment data
                        accompaniments = line_values['accompaniment_ids']
                        processed_accompaniments = []
                        
                        for acc_data in accompaniments:
                            if isinstance(acc_data, dict):
                                # Remove line_id to avoid conflicts
                                acc_data.pop('line_id', None)
                                # Set status to done
                                acc_data['status'] = 'done'
                                processed_accompaniments.append(acc_data)
                        
                        line_values['accompaniment_ids'] = processed_accompaniments
        
        # Call parent method
        order_id = super()._process_order(order, existing_order)
        
        # Create accompaniment picking if needed
        if order_id and not draft:
            # Récupérer l'objet order à partir de l'ID
            order_obj = self.browse(order_id) if isinstance(order_id, int) else order_id
            order_obj._create_accompaniment_picking()
        
        return order_id
    
    def _create_accompaniment_picking(self):
        """Create a picking for accompaniments if needed"""
        accompaniment_ids = self.get_accompaniment_ids()
        if not accompaniment_ids:
            return
        
        # Check if there are stockable accompaniment products
        stockable_accompaniments = accompaniment_ids.filtered(
            lambda acc: acc.product_id.type in ['product', 'consu']
        )
        
        if not stockable_accompaniments:
            return
        
        # Get picking type
        picking_type = self._get_picking_type()
        if not picking_type:
            raise UserError(_('No outgoing picking type found.'))
        
        # Create picking
        picking_vals = self._prepare_accompaniment_picking_values(picking_type)
        picking = self.env['stock.picking'].create(picking_vals)
        
        # Create moves for accompaniments
        for accompaniment in stockable_accompaniments:
            move_vals = self._prepare_accompaniment_move_values(accompaniment, picking)
            self.env['stock.move'].create(move_vals)
        
        # Confirm and process picking
        picking.action_confirm()
        picking.action_assign()
        
        # Set picking reference
        self.picking_accompaniment_id = picking
        
        return picking
    
    def _get_picking_type(self):
        """Get the appropriate picking type for accompaniments"""
        return self.env['stock.picking.type'].search([
            ('code', '=', 'outgoing'),
            ('warehouse_id', '=', self.picking_type_id.warehouse_id.id)
        ], limit=1)
    
    def _prepare_accompaniment_picking_values(self, picking_type):
        """Prepare values for accompaniment picking"""
        return {
            'partner_id': self.partner_id.id if self.partner_id else False,
            'picking_type_id': picking_type.id,
            'location_id': picking_type.default_location_src_id.id,
            'location_dest_id': picking_type.default_location_dest_id.id,
            'origin': self.name,
            'move_type': 'direct',
            'state': 'draft',
        }
    
    def _prepare_accompaniment_move_values(self, accompaniment, picking):
        """Prepare values for accompaniment stock move"""
        return {
            'name': accompaniment.name,
            'product_id': accompaniment.product_id.id,
            'product_uom_qty': accompaniment.quantity,
            'product_uom': accompaniment.product_id.uom_id.id,
            'picking_id': picking.id,
            'location_id': picking.location_id.id,
            'location_dest_id': picking.location_dest_id.id,
            'state': 'draft',
        }