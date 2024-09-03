from odoo import models, fields

class POSCategory(models.Model):
    _inherit = 'pos.category'

    is_accompaniment = fields.Boolean(string="Is Accompaniment", help="Indicates if this category is used for accompaniments.")
