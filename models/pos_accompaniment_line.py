# -*- coding: utf-8 -*-

from odoo import models, fields

class PosAccompaniment(models.Model):
    _name = 'pos.accompaniment.line'

    name = fields.Char(string='Name')
    quantity = fields.Float(string='Quantity')
    line_id = fields.Many2one('pos.order.line', string='Order Line', ondelete='cascade')
    status = fields.Selection([
        ('new', 'New'),
        ('done', 'Done'),
        ('cancel', 'Cancel')
    ], default='new', string='Status')
    price = fields.Float(string='Price Unit')
    product_id = fields.Many2one('product.product', string='Product')
