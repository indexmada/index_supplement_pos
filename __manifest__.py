# -*- coding: utf-8 -*-
{
    'name': "Index supplement POS",
    'summary': "",
    'description': """
        Module Description:
        This module provides additional functionality for the Point of Sale (POS)
         module in Odoo. It enhances the existing features and adds new features to improve 
         the overall user experience and efficiency of the POS system.
    """,
    'author': "",
    'website': "",
    "license": "LGPL-3",
    'category': 'point of sale',
    'version': '1.0',
    'depends': ['base', 'product', 'point_of_sale'],
    "data": [
        "security/ir.model.access.csv",
        "views/product_category_views.xml",
        "views/index_supplement_pos_assets.xml",
        "views/pos_order_views.xml"
    ],
    'installable': True,
    'application': True,
    'qweb': [
        'static/src/xml/orderlines.xml',
    ],
}
