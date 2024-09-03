## Index Supplement POS

## Overview

The `index_supplement_pos` module extends the Odoo Point of Sale (POS) functionality to manage and display accompaniments (additional items) associated with order lines. This module allows users to:

- Add accompaniments to POS order lines.
- Display accompaniments directly in the order line details.
- Recalculate prices dynamically based on selected accompaniments.
- Maintain notes for each accompaniment, which are visible in the POS interface and order details.

## Features

- **Add Accompaniments**: Easily add accompaniments to any order line within the POS interface.
- **Dynamic Price Calculation**: Prices are recalculated in real-time based on the base price and the cost of added accompaniments.
- **Accompaniment Notes**: Include notes for each accompaniment directly on the order line.
- **Visual Indicators**: Order lines with accompaniments are visually indicated in the POS interface for better user experience.
- **Integration with Backend**: Accompaniment details and notes are saved in the backend and can be viewed in the order detail views.

## Installation

1. **Download and Install**: Place the `index_supplement_pos` module folder in your Odoo add-ons directory.
2. **Update App List**: Restart your Odoo server and navigate to `Apps` > `Update Apps List`.
3. **Install the Module**: Search for `Index Supplement POS` and click on the `Install` button.

## Usage

1. **Adding Accompaniments**:
   - In the POS interface, select a product and click the `Add Accompaniment` button.
   - Choose accompaniments from the list and specify their quantities.
   
2. **Viewing Accompaniments**:
   - Accompaniments added to a product will be displayed directly in the order line details.
   - Notes associated with accompaniments can be viewed under the "Notes" section in the POS interface.

3. **Price Recalculation**:
   - The total price of the order line is automatically updated to reflect the base product price plus the cost of all accompaniments.

4. **Backend Management**:
   - Accompaniment data, including notes and pricing, is stored in the backend and can be accessed via the order details view.

## Configuration

- **Accompaniment Product Categories**: Products that can be used as accompaniments should be marked in the product category settings. Navigate to `Inventory` > `Product Categories` and set the `Is Accompaniment` field to true.

## Compatibility

- Odoo 12.0e