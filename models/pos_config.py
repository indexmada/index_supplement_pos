# -*- coding: utf-8 -*-
# use params to enable or disable features in the POS

from odoo import api, fields, models


class PosConfig(models.Model):
    _inherit = 'pos.config'

    required_guest_on_table = fields.Boolean(string='Required Guest',
                                             help='Required Guest number before order line in table.',
                                             default=False)
