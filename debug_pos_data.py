#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
Script de débogage pour vérifier les données POS
Usage: python debug_pos_data.py
"""

import os
import sys

# Add Odoo path
odoo_path = os.path.join(os.path.dirname(__file__), '..', '..', '..', 'odoo18.2', 'odoo')
sys.path.insert(0, odoo_path)

import odoo
from odoo import api, SUPERUSER_ID

def debug_pos_data():
    """Debug POS data loading"""
    
    # Initialize Odoo
    odoo.cli.server.main()
    
    # Get environment
    env = api.Environment(cr, SUPERUSER_ID, {})
    
    print("🔧 === DEBUG POS DATA ===")
    
    # Check POS categories
    pos_categories = env['pos.category'].search([])
    print(f"📂 Total POS categories: {len(pos_categories)}")
    
    for category in pos_categories:
        print(f"📂 Category: {category.name}")
        print(f"   - ID: {category.id}")
        print(f"   - is_accompaniment: {category.is_accompaniment}")
        print(f"   - Available in POS: {category.available_in_pos}")
        print("   ---")
    
    # Check products in accompaniment categories
    accompaniment_categories = env['pos.category'].search([('is_accompaniment', '=', True)])
    print(f"🎯 Accompaniment categories found: {len(accompaniment_categories)}")
    
    for category in accompaniment_categories:
        products = env['product.product'].search([
            ('pos_categ_ids', 'in', category.id),
            ('available_in_pos', '=', True)
        ])
        print(f"📦 Category '{category.name}' has {len(products)} products:")
        for product in products:
            print(f"   - {product.name} (ID: {product.id})")
        print("   ---")
    
    # Test POS data loading
    print("🔧 Testing POS data loading...")
    pos_config = env['pos.config'].search([], limit=1)
    if pos_config:
        print(f"📊 Using POS config: {pos_config.name}")
        
        # Test category data loading
        categories_data = pos_config._get_pos_category_data()
        print(f"📊 Categories loaded for POS: {len(categories_data)}")
        
        for cat_data in categories_data:
            print(f"📊 Category data: {cat_data}")
            if 'is_accompaniment' in cat_data:
                print(f"   - is_accompaniment: {cat_data['is_accompaniment']}")
            else:
                print(f"   - is_accompaniment: NOT FOUND")
            print("   ---")
    else:
        print("❌ No POS config found")
    
    print("🔧 === END DEBUG ===")

if __name__ == "__main__":
    debug_pos_data() 