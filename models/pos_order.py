# -*- coding: utf-8 -*-

from odoo import models, fields, api

class PosOrder(models.Model):
    _inherit = 'pos.order'

    accompaniment_ids = fields.Many2many('pos.accompaniment.line', string='Accompagnements', compute='_compute_accompaniment_ids')

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
        """Override to process custom fields."""
        # Find and update order lines with accompaniment details
        for line_data in pos_order['lines']:
            line = line_data[2]  # line data dict is the third element
            new_acc = []
            accompaniments = line.get('accompaniment_ids', [])
            for acc in accompaniments:
                del acc['line_id']
                new_acc.append((0, 0, {**acc, 'status': 'done'}))
            line['accompaniment_ids'] = new_acc
        
        order = super(PosOrder, self)._process_order(pos_order)
        
        return order