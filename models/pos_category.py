# -*- coding: utf-8 -*-

from odoo import models, fields, api


class PosCategory(models.Model):
    _inherit = 'pos.category'
    
    is_accompaniment = fields.Boolean(
        string="Is Accompaniment",
        help="Indicates if this category is used for accompaniments/supplements.",
        default=False
    )
    
    def write(self, vals):
        """Log when is_accompaniment is modified"""
        if 'is_accompaniment' in vals:
            print(f"🔧 [POS Category] Setting is_accompaniment to {vals['is_accompaniment']} for categories: {self.mapped('name')}")
        return super().write(vals)
    
    def _load_pos_data_fields(self, config_id):
        """Load additional fields for POS data"""
        result = super()._load_pos_data_fields(config_id)
        result.append('is_accompaniment')
        print(f"🔧 [POS Category] Loading fields for POS: {result}")
        return result
