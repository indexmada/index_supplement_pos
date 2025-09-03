============================
Index Supplement POS for Odoo 18
============================

.. image:: https://img.shields.io/badge/License-LGPL%203-blue.svg
   :target: https://www.gnu.org/licenses/lgpl-3.0

.. image:: https://img.shields.io/badge/Odoo-18.0-red.svg
   :target: https://odoo.com/

Overview
========

The **Index Supplement POS** module extends the Odoo Point of Sale (POS) functionality to manage and display accompaniments (additional items/supplements) associated with order lines. This module provides a modern, user-friendly interface built with Odoo's OWL framework for Odoo 18.

This module allows users to:

- Add accompaniments/supplements to POS order lines
- Display accompaniments directly in the order line details
- Recalculate prices dynamically based on selected accompaniments
- Maintain notes for each accompaniment visible in the POS interface
- Create automatic stock movements for accompaniment products
- Organize accompaniments by product categories

Features
========

🎯 **Core Features**
-------------------

- **Easy Accompaniment Management**: Add and manage supplements through an intuitive popup interface
- **Dynamic Price Calculation**: Prices are recalculated in real-time based on the base price and accompaniment costs
- **Visual Indicators**: Order lines with accompaniments are visually indicated in the POS interface
- **Stock Integration**: Automatic stock movements for accompaniment products
- **Category-Based Organization**: Accompaniments organized by product categories
- **Search Functionality**: Quick search through available supplements

🔧 **Technical Features**
-----------------------

- **OWL Framework**: Built with Odoo 18's OWL framework for modern, reactive components
- **Responsive Design**: Mobile-friendly interface that works on all screen sizes
- **Dark Theme Support**: Automatic dark theme adaptation
- **Real-time Updates**: Instant UI updates when accompaniments are added or removed
- **Backend Integration**: Complete integration with Odoo's backend systems

Installation
============

Requirements
------------

- Odoo 18.0 or higher
- Point of Sale module installed

Installation Steps
------------------

1. **Download the Module**:
   
   .. code-block:: bash
   
      git clone https://github.com/your-repo/index_supplement_pos.git
      
   Or download and extract the module folder to your Odoo addons directory.

2. **Update Apps List**:
   
   - Restart your Odoo server
   - Navigate to ``Apps`` → ``Update Apps List``

3. **Install the Module**:
   
   - Search for ``Index Supplement POS``
   - Click on the ``Install`` button

Configuration
=============

Setting Up Accompaniment Categories
-----------------------------------

1. Navigate to ``Point of Sale`` → ``Configuration`` → ``Point of Sale Categories``
2. Create or edit a category that will contain accompaniment products
3. Check the ``Is Accompaniment`` checkbox for categories containing supplements
4. Save the category

Adding Accompaniment Products
-----------------------------

1. Navigate to ``Point of Sale`` → ``Products`` → ``Products``
2. Create or edit products that will be used as accompaniments
3. Assign them to categories marked as ``Is Accompaniment``
4. Set appropriate prices for the accompaniment products
5. Ensure the products are available in POS

Usage
=====

For POS Users
-------------

1. **Adding Accompaniments**:
   
   - In the POS interface, select a product and add it to the order
   - Click the ``Supplements`` button on the order line
   - Choose accompaniments from the categorized list
   - Specify quantities using the +/- buttons or input field
   - Click ``Confirm Selection`` to add the supplements

2. **Viewing Accompaniments**:
   
   - Accompaniments are displayed as notes under the order line
   - The supplement button shows a badge with the number of selected items
   - Total accompaniment price is shown separately

3. **Modifying Accompaniments**:
   
   - Click the ``Supplements`` button again to modify selections
   - Change quantities or remove items by setting quantity to 0
   - Confirm changes to update the order

4. **Search and Filter**:
   
   - Use the search bar in the supplement popup to find specific items
   - Products are organized by category for easy navigation

For Administrators
------------------

1. **Backend Management**:
   
   - View accompaniment details in ``Point of Sale`` → ``Orders`` → ``Orders``
   - Access accompaniment lines via ``Point of Sale`` → ``Accompaniment Lines``
   - Check stock movements for accompaniment products

2. **Reporting**:
   
   - Accompaniment data is included in order reports
   - Track accompaniment sales and inventory

Technical Details
=================

Module Structure
----------------

.. code-block::

   index_supplement_pos/
   ├── __init__.py
   ├── __manifest__.py
   ├── models/
   │   ├── __init__.py
   │   ├── pos_category.py          # Category model extensions
   │   ├── pos_accompaniment_line.py # Accompaniment line model
   │   ├── pos_order_line.py        # Order line model extensions
   │   └── pos_order.py             # Order model extensions
   ├── views/
   │   ├── pos_category_views.xml   # Category form views
   │   ├── pos_order_views.xml      # Order and accompaniment views
   │   └── pos_supplement_assets.xml # Asset definitions
   ├── static/src/
   │   ├── js/
   │   │   ├── models.js             # POS model extensions
   │   │   └── components/
   │   │       ├── supplement_popup.js    # OWL popup component
   │   │       └── orderline_widget.js    # Orderline widget patch
   │   ├── xml/
   │   │   ├── orderline_templates.xml    # Orderline templates
   │   │   └── supplement_popup_templates.xml # Popup templates
   │   └── scss/
   │       └── pos_supplement_style.scss   # Styling
   ├── security/
   │   └── ir.model.access.csv      # Access permissions
   └── README.rst

Data Models
-----------

**pos.accompaniment.line**
  - ``name``: Accompaniment name
  - ``product_id``: Reference to the product
  - ``quantity``: Quantity selected
  - ``price``: Unit price
  - ``total_price``: Computed total price
  - ``status``: Status (new, done, cancel)
  - ``line_id``: Reference to the order line

**pos.order.line** (Extended)
  - ``accompaniment_ids``: One2many to accompaniment lines
  - ``accompaniment_note``: Text field for accompaniment notes
  - ``accompaniment_total``: Computed total of accompaniments
  - ``has_accompaniments``: Boolean indicator

**pos.category** (Extended)
  - ``is_accompaniment``: Boolean flag for accompaniment categories

JavaScript Architecture
-----------------------

The module uses Odoo 18's OWL framework:

- **Models**: Patches to POS Order and Orderline models
- **Components**: OWL components for popup and UI elements
- **Services**: Integration with POS services and popup service
- **Templates**: QWeb templates for UI rendering

Customization
=============

Extending the Module
-------------------

You can extend this module by:

1. **Adding Custom Fields**: Extend the ``pos.accompaniment.line`` model
2. **Custom UI Components**: Create new OWL components
3. **Additional Business Logic**: Add custom methods to the models
4. **Integration**: Connect with other modules or external systems

API Reference
-------------

**JavaScript API**:

.. code-block:: javascript

   // Add accompaniment to order line
   orderline.add_accompaniment({
       name: 'Supplement Name',
       product_id: 123,
       quantity: 1,
       price: 2.50
   });
   
   // Get accompaniment total
   const total = orderline.get_accompaniment_total();
   
   // Check if has accompaniments
   const hasAccompaniments = orderline.has_accompaniments();

**Python API**:

.. code-block:: python

   # Get accompaniments for an order
   accompaniments = order.accompaniment_ids
   
   # Create accompaniment line
   accompaniment = self.env['pos.accompaniment.line'].create({
       'name': 'Supplement Name',
       'product_id': product_id,
       'quantity': 1,
       'price': 2.50,
       'line_id': order_line_id
   })

Troubleshooting
===============

Common Issues
-------------

1. **Accompaniment Categories Not Showing**:
   
   - Ensure categories are marked as ``Is Accompaniment``
   - Check that products are assigned to these categories
   - Verify products are available in POS

2. **Supplements Button Not Appearing**:
   
   - Clear browser cache and restart Odoo
   - Check if the module is properly installed
   - Verify JavaScript files are loading correctly

3. **Stock Issues**:
   
   - Check product types (stockable products create stock moves)
   - Verify warehouse and location settings
   - Check picking type configurations

4. **Performance Issues**:
   
   - Reduce number of accompaniment products if too many
   - Optimize database if needed
   - Check server resources

Support and Maintenance
======================

Version Compatibility
---------------------

- **Odoo 18.0**: Fully supported
- **Odoo 17.0**: Not compatible (use v17 branch)
- **Odoo 16.0**: Not compatible (use v16 branch)

Migration from Previous Versions
--------------------------------

If migrating from the Odoo 12 version:

1. Backup your database
2. Update the module to Odoo 18 version
3. Run database upgrade
4. Test thoroughly before going live

Contributing
============

We welcome contributions! Please:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

License
=======

This module is licensed under the LGPL-3 License. See the LICENSE file for details.

Support
=======

For support, please:

1. Check this documentation first
2. Search existing GitHub issues
3. Create a new issue with detailed information
4. Contact support@yourcompany.com

Changelog
=========

Version 18.0.1.0.0
-------------------

- **New**: Complete rewrite for Odoo 18 using OWL framework
- **New**: Modern, responsive UI with dark theme support
- **New**: Improved search and filtering capabilities
- **New**: Better stock integration and picking management
- **New**: Enhanced mobile experience
- **Improved**: Performance optimizations
- **Improved**: Better error handling and validation
- **Fixed**: Various bug fixes from previous versions

Credits
=======

**Authors**:
- Your Company Name

**Contributors**:
- Developer Name

**Special Thanks**:
- Odoo Community for the amazing framework
- All users who provided feedback and suggestions

**Third-party Libraries**:
- FontAwesome for icons
- Bootstrap for styling components