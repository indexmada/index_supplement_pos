# -*- coding: utf-8 -*-

from odoo import models, fields

class PosOrderLine(models.Model):
    _inherit = 'pos.order.line'

    accompaniment_ids = fields.Many2many('pos.accompaniment.line', 'line_id',string='Accompagnements')
    accompaniment_note = fields.Text(string='Accompagnement Note')
