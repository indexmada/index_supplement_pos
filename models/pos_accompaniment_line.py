# -*- coding: utf-8 -*-

from odoo import models, fields, api


class PosAccompanimentLine(models.Model):
    _name = 'pos.accompaniment.line'
    _description = 'POS Accompaniment Line'
    _order = 'id desc'
    
    name = fields.Char(string='Name', required=True)
    quantity = fields.Float(string='Quantity', default=1.0)
    line_id = fields.Many2one(
        'pos.order.line', 
        string='Order Line', 
        ondelete='cascade',
        required=True
    )
    status = fields.Selection([
        ('new', 'New'),
        ('done', 'Done'),
        ('cancel', 'Cancel')
    ], default='new', string='Status', required=True)
    
    price = fields.Float(string='Unit Price', digits='Product Price')
    product_id = fields.Many2one(
        'product.product', 
        string='Product',
        required=True
    )
    
    # Computed fields
    total_price = fields.Float(
        string='Total Price',
        compute='_compute_total_price',
        store=True
    )
    
    @api.depends('quantity', 'price')
    def _compute_total_price(self):
        """Compute the total price of the accompaniment line"""
        for line in self:
            line.total_price = line.quantity * line.price
    
    @api.model
    def create_from_ui(self, values):
        """Create accompaniment line from POS UI"""
        return self.create(values)
    
    def write_from_ui(self, values):
        """Update accompaniment line from POS UI"""
        return self.write(values)
    
    def unlink_from_ui(self):
        """Delete accompaniment line from POS UI"""
        return self.unlink()
