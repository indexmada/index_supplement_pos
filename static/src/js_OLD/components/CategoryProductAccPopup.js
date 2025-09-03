/** @odoo-module */

import { Component, useState } from "@odoo/owl";
import { Dialog } from "@web/core/dialog/dialog";

export class CategoryProductAccPopup extends Component {
    static template = "index_supplement_pos.CategoryProductAccPopup";
    static components = { Dialog };
    static props = {
        productsToDisplay: { type: Object, optional: true },
        orderline: { type: Object, optional: true },
        getPayload: Function,
        close: Function,
    };
    
    setup() {
        this.state = useState({
            productsToDisplay: this.props.productsToDisplay || {},
            selectedProducts: new Set(),
            searchTerm: '',
            filteredProducts: this.props.productsToDisplay || {},
        });
        
        // Update filtered products when search term changes
        this.updateFilteredProducts();
    }
    
    /**
     * Get all products from all categories
     */
    _getAllProducts() {
        const products = [];
        Object.entries(this.state.productsToDisplay).forEach(([key, value]) => {
            products.push(...value.products);
        });
        return products;
    }
    
    /**
     * Update filtered products based on search term
     */
    updateFilteredProducts() {
        const searchTerm = this.state.searchTerm.toLowerCase().trim();
        
        if (!searchTerm) {
            this.state.filteredProducts = this.state.productsToDisplay;
            return;
        }
        
        const filtered = {};
        Object.entries(this.state.productsToDisplay).forEach(([categoryName, categoryData]) => {
            const filteredProducts = categoryData.products.filter(product => 
                product.display_name.toLowerCase().includes(searchTerm)
            );
            
            if (filteredProducts.length > 0) {
                filtered[categoryName] = {
                    ...categoryData,
                    products: filteredProducts
                };
            }
        });
        
        this.state.filteredProducts = filtered;
    }
    
    /**
     * Handle search input change
     */
    onSearchChange(ev) {
        this.state.searchTerm = ev.target.value;
        this.updateFilteredProducts();
    }
    
    /**
     * Handle product selection
     */
    onProductClick(ev) {
        const productId = parseInt(ev.currentTarget.dataset.productId);
        if (!productId) return;
        
        const products = this._getAllProducts();
        const product = products.find(p => p.id === productId);
        
        if (product) {
            if (product.selected) {
                product.selected = false;
                this.state.selectedProducts.delete(productId);
            } else {
                product.selected = true;
                this.state.selectedProducts.add(productId);
            }
        }
    }
    
    /**
     * Confirm selection and add accompaniments
     */
    confirm() {
        const products = this._getAllProducts();
        const selectedProducts = products.filter(p => p.selected === true);
        
        if (selectedProducts.length > 0) {
            console.log('✅ Adding accompaniments:', selectedProducts.map(p => `${p.display_name} (${p.lst_price} Ar)`));
            this.onAddAccompanimentClick(selectedProducts);
        }
        
        this.props.getPayload({ confirmed: true, products: selectedProducts });
        this.props.close();
    }
    
    /**
     * Cancel selection
     */
    cancel() {
        this.props.getPayload({ confirmed: false });
        this.props.close();
    }
    
    /**
     * Add accompaniments to the selected orderline
     */
    onAddAccompanimentClick(products = []) {
        try {
            // Use the orderline passed as prop instead of trying to get selected line
            const orderline = this.props.orderline;
            
            if (orderline && products.length > 0) {
                const accompaniments = products.map(product => ({
                    line_id: orderline.id,
                    quantity: 1,
                    name: product.display_name,
                    price: product.lst_price,
                    status: 'new',
                    product_id: product.id,
                }));
                
                // Add accompaniments to the orderline
                if (orderline.add_accompaniments) {
                    orderline.add_accompaniments(accompaniments);
                } else {
                    // Fallback: manually add to accompaniment_ids
                    if (!orderline.accompaniment_ids) {
                        orderline.accompaniment_ids = [];
                    }
                    orderline.accompaniment_ids.push(...accompaniments);
                }
                
                // Update the orderline display
                if (orderline._update_accompaniment_notes) {
                    orderline._update_accompaniment_notes();
                }
                
                // Recalculate price
                if (orderline._recalculate_price) {
                    orderline._recalculate_price();
                }
                
                // Trigger change event to update UI
                if (orderline.trigger) {
                    orderline.trigger('change', orderline);
                }
                
                // Force UI update by triggering order change
                const pos = this.env.services.pos;
                const order = pos.get_order();
                if (order && order.trigger) {
                    order.trigger('change', order);
                }
                
                // Force component re-render
                if (this.render) {
                    this.render();
                }
                
                console.log('✅ Accompaniments added to orderline successfully');
            } else {
                console.warn('⚠️ No orderline or no products to add');
            }
        } catch (error) {
            console.error('❌ Error adding accompaniments:', error);
        }
    }
} 