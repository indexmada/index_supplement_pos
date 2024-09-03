# -*- coding: utf-8 -*-

from odoo import models, fields, api

class ProductCategory(models.Model):
    _inherit = 'product.category'

    is_accompaniment = fields.Boolean(string='Accompagnement', default=False, help='Check this box if this category is an accompaniment category.')
    
    # @api.onchange('is_accompaniment')
    # def _onchange_accompaniment(self):
    #     for rec in self:
    #         value = rec.is_accompaniment
    #         while rec.parent_id:
    #             rec = rec.parent_id
    #             rec.is_accompaniment = value
    
    