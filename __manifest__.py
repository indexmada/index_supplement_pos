# -*- coding: utf-8 -*-
{
    'name': 'Index Supplement POS',
    'version': '18.0.1.0.0',
    'category': 'Point of Sale',
    'summary': 'Manage accompaniments and supplements in Point of Sale',
    'description': """
Index Supplement POS for Odoo 18
================================

This module extends the Odoo Point of Sale (POS) functionality to manage and display 
accompaniments (additional items/supplements) associated with order lines.

Features:
- Add accompaniments/supplements to POS order lines
- Display accompaniments directly in the order line details
- Recalculate prices dynamically based on selected accompaniments
- Maintain notes for each accompaniment visible in the POS interface
- Create automatic stock movements for accompaniment products
- Organize accompaniments by product categories
- Modern OWL-based interface for Odoo 18
    """,
    'author': 'Index',
    'website': 'https://www.index-mada.com',
    'license': 'LGPL-3',
    'depends': [
        'point_of_sale',
        'stock',
    ],
    'data': [
        'security/ir.model.access.csv',
        'views/pos_category_views.xml',
        'views/pos_order_views.xml',
    ],
    'assets': {
        'point_of_sale._assets_pos': [
            # JavaScript files - Core functionality
            'index_supplement_pos/static/src/js/models.js',
            'index_supplement_pos/static/src/js/pos_orderline.js',
            'index_supplement_pos/static/src/js/screens.js',
            
            # JavaScript files - Components
            'index_supplement_pos/static/src/js/components/index.js',
            'index_supplement_pos/static/src/js/components/supplement_popup.js',
            'index_supplement_pos/static/src/js/components/CategoryProductAccPopup.js',
            

            
            # XML Templates
            'index_supplement_pos/static/src/xml/orderline_templates.xml',
            'index_supplement_pos/static/src/xml/supplement_popup_templates.xml',
            'index_supplement_pos/static/src/xml/supplement_receipt_templates.xml',
            
            # SCSS files 
            'index_supplement_pos/static/src/scss/pos_suppl_style.scss',
            'index_supplement_pos/static/src/scss/pos_supplement_style.scss',
        ],
    },
    'installable': True,
    'auto_install': False,
    'application': False,
    'sequence': 1,
} 