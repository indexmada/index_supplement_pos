/** @odoo-module */

import { OrderWidget } from "@point_of_sale/app/generic_components/order_widget/order_widget";
import { Orderline } from "@point_of_sale/app/generic_components/orderline/orderline";
import { PosStore } from "@point_of_sale/app/store/pos_store";
import { patch } from "@web/core/utils/patch";
import { CategoryProductAccPopup } from "./components/CategoryProductAccPopup";
import { makeAwaitable } from "@point_of_sale/app/store/make_awaitable_dialog";

// Global function for handling supplement popup
window.openSupplementPopup = async function(ev, orderline) {
    if (ev) {
        ev.stopPropagation();
    }
    
    console.log('Supplement button clicked for orderline:', orderline);
    
    // Try to find the POS app and dialog service
    try {
        // Method 1: Try to get from the event target's component
        let component = ev?.target?.closest?.('.o-pos-app')?.ownerDocument?.defaultView?.odoo?.loader?.modules?.get?.('@point_of_sale/app/pos_app')?.PosApp;
        
        // Method 2: Try to get from global registry
        if (!component) {
            const registry = window.odoo?.loader?.modules;
            if (registry) {
                // Look for any POS component that might have dialog service
                for (const [key, module] of registry) {
                    if (key.includes('pos') && module.env?.services?.dialog) {
                        component = module;
                        break;
                    }
                }
            }
        }
        
        // Method 3: Simple approach - get from window if available
        const pos = window.posApp || window.pos;
        if (pos?.env?.services?.dialog) {
            const productsToDisplay = getProductsByCategory(pos, orderline);
            
            const result = await makeAwaitable(pos.env.services.dialog, CategoryProductAccPopup, {
                productsToDisplay: productsToDisplay,
                orderline: orderline,
            });
            
            if (result && result.confirmed) {
                console.log('Supplements selected:', result.products);
            }
            return;
        }
        
        // Fallback: show alert with more info
        alert(`Supplement popup for: ${orderline?.product?.display_name || 'Unknown product'}\n\nTODO: Dialog service not accessible from global function.\nNeed to implement via component patch.`);
        
    } catch (error) {
        console.error('Error opening supplement popup:', error);
        alert('Error opening supplement popup. Check console for details.');
    }
};

function getProductsByCategory(pos, orderline) {
    const accompanimentCategoryIds = {};
    
    // Safety check: ensure pos and models are loaded
    if (!pos || !pos.models || !pos.models["pos.category"]) {
        console.warn('POS data not fully loaded yet');
        return accompanimentCategoryIds;
    }
    
    try {
        // Get all categories and filter for accompaniment categories
        const categories = pos.models["pos.category"].getAll();
        
        for (const category of categories) {
            // Check if the category has 'is_accompaniment' set to true
            if (category && category.is_accompaniment) {
                accompanimentCategoryIds[category.name] = {
                    id: category.id,
                    products: getProductsPerCategory(pos, orderline, category.id),
                };
            }
        }
    } catch (error) {
        console.error('Error getting categories:', error);
    }
    
    return accompanimentCategoryIds;
}

function getProductsPerCategory(pos, orderline, category_id) {
    const products = [];
    
    // Safety check
    if (!pos || !pos.models || !pos.models["product.product"]) {
        console.warn('Product data not fully loaded yet');
        return products;
    }
    
    try {
        const acc_line = orderline && orderline.accompaniment_ids ? 
            orderline.accompaniment_ids.map(acc => acc.product_id) : [];
            
        // Get all products and filter by category
        const allProducts = pos.models["product.product"].getAll();
        const categoryProducts = allProducts.filter(product => 
            product && product.pos_categ_ids && product.pos_categ_ids.includes(category_id)
        );
        
        categoryProducts.forEach(product => {
            const image_url = window.location.origin + '/web/image?model=product.product&field=image_medium&id=' + product.id;
            const productCopy = { ...product };
            productCopy.image_url = image_url;
            
            if (acc_line.includes(product.id)) {
                productCopy.selected = true;
            } else {
                productCopy.selected = false;
            }
            
            products.push(productCopy);
        });
    } catch (error) {
        console.error('Error getting products for category:', error);
    }
    
    return products;
}

// Patch Orderline component to add supplement functionality
patch(Orderline.prototype, {
    /**
     * Open supplement selection popup from orderline component
     */
    async openSupplementPopup(ev, line) {
        if (ev) {
            ev.stopPropagation();
        }
        
        console.log('Opening supplement popup for line:', line);
        
        try {
            // Access dialog service through component's env
            const productsToDisplay = this.getProductsByCategory(line);
            
            // Get the actual PosOrderline object from the order
            const pos = this.env.services.pos;
            const order = pos.get_order();
            
            // Find the correct orderline by matching product name and other properties
            let actualOrderline = null;
            const orderlines = order.get_orderlines();
            
            console.log('🔧 Looking for orderline with product:', line.productName);
            console.log('🔧 Available orderlines:', orderlines.length);
            
            for (const orderline of orderlines) {
                const product = orderline.get_product();
                console.log('🔧 Checking orderline product:', product?.display_name);
                
                if (product && product.display_name === line.productName) {
                    actualOrderline = orderline;
                    console.log('✅ Found matching orderline:', actualOrderline);
                    break;
                }
            }
            
            if (!actualOrderline) {
                console.warn('⚠️ No matching orderline found, using first one');
                actualOrderline = orderlines[0];
            }
            
            console.log('🔧 Opening popup with orderline:', line);
            console.log('🔧 Actual PosOrderline object:', actualOrderline);
            
            const result = await makeAwaitable(this.env.services.dialog, CategoryProductAccPopup, {
                productsToDisplay: productsToDisplay,
                orderline: actualOrderline, // Pass the actual PosOrderline object
            });
            
            if (result && result.confirmed) {
                console.log('Supplements selected:', result.products);
            }
        } catch (error) {
            console.error('Error opening supplement popup:', error);
            // Fallback to alert
            alert(`Error opening supplement popup for: ${line?.productName || 'Unknown product'}`);
        }
    },
    
    /**
     * Get products organized by accompaniment categories
     */
            getProductsByCategory(orderline) {
        const accompanimentCategoryIds = {};
        
        // Access POS data through env - try different methods
        let pos = this.env.pos;
        // Get POS object
        if (!pos) {
            pos = this.env.services.pos;
        }
        
        if (!pos || !pos.models || !pos.models["pos.category"]) {
            console.warn('❌ POS data not fully loaded yet');
            return accompanimentCategoryIds;
        }
        
        try {
            // Get all categories and filter for accompaniment categories
            const categories = pos.models["pos.category"].getAll();
            
            for (const category of categories) {
                if (category && category.is_accompaniment === true) {
                    const products = this.getProductsPerCategory(pos, orderline, category.id);
                    
                        accompanimentCategoryIds[category.name] = {
                        id: category.id,
                        products: products,
                        };
                }
            }
        } catch (error) {
            console.error('❌ Error getting categories:', error);
        }
        
            return accompanimentCategoryIds;
        },

    /**
     * Get products for a specific category
     */
    getProductsPerCategory(pos, orderline, category_id) {
        const products = [];
        
        if (!pos.models["product.product"]) {
            console.warn('❌ Product model not available');
            return products;
        }
        
        try {
            const acc_line = orderline && orderline.accompaniment_ids ? 
                orderline.accompaniment_ids.map(acc => acc.product_id) : [];
                
            // Get all products and filter by category
            const allProducts = pos.models["product.product"].getAll();
            const categoryProducts = allProducts.filter(product => {
                if (!product || !product.pos_categ_ids) {
                    return false;
                }
                
                // Check if pos_categ_ids includes the category_id
                if (product.pos_categ_ids.includes && product.pos_categ_ids.includes(category_id)) {
                    return true;
                }
                
                // Alternative check: if pos_categ_ids is an array of objects
                if (Array.isArray(product.pos_categ_ids)) {
                    const hasCategory = product.pos_categ_ids.some(cat => {
                        if (typeof cat === 'object' && cat.id === category_id) {
                            return true;
                        }
                        return cat === category_id;
                    });
                    if (hasCategory) return true;
                }
                
                return false;
            });
            
            categoryProducts.forEach(product => {
                const image_url = window.location.origin + '/web/image?model=product.product&field=image_medium&id=' + product.id;
                const productCopy = { ...product };
                productCopy.image_url = image_url;
                
                if (acc_line.includes(product.id)) {
                    productCopy.selected = true;
                } else {
                    productCopy.selected = false;
                }
                
                products.push(productCopy);
            });
        } catch (error) {
            console.error('Error getting products for category:', error);
        }
        
        return products;
    }
});


// Patch Orderline component to add accompaniment methods
patch(Orderline.prototype, {
    setup() {
        super.setup();
    },
    
    /**
     * Get accompaniments for the current line
     */
    getAccompaniments() {
        // Try to get the actual PosOrderline object
        let pos = this.env.pos;
        if (!pos) {
            pos = this.env.services.pos;
        }
        
        if (pos && pos.get_order) {
            const order = pos.get_order();
            
            if (order && order.lines) {
                // Find the matching orderline by product name
                const matchingOrderline = order.lines.find(ol => {
                    // Try multiple ways to get the product name
                    let productName = '';
                    
                    // Method 1: full_product_name (most reliable in Odoo 18)
                    if (ol.full_product_name) {
                        productName = ol.full_product_name;
                    }
                    // Method 2: get_product() method
                    else if (ol.get_product && typeof ol.get_product === 'function') {
                        const product = ol.get_product();
                        productName = product ? product.display_name : '';
                    }
                    // Method 3: product_id lookup
                    else if (ol.product_id) {
                        const pos = this.env.pos || this.env.services.pos;
                        if (pos && pos.models && pos.models['product.product']) {
                            const product = pos.models['product.product'].get(ol.product_id);
                            productName = product ? product.display_name : '';
                        }
                    }
                    
                    return productName === this.props.line.productName;
                });
                
                if (matchingOrderline) {
                    return {
                        accompaniment_ids: matchingOrderline.accompaniment_ids || [],
                        accompaniment_total: matchingOrderline.accompaniment_total || 0,
                        accompaniment_note: matchingOrderline.accompaniment_note || '',
                        has_accompaniments: matchingOrderline.has_accompaniments || false,
                    };
                }
            }
        }
        
        return {
            accompaniment_ids: [],
            accompaniment_total: 0,
            accompaniment_note: '',
            has_accompaniments: false,
        };
    },
});

// Note: Removed PosStore patch to avoid setup conflicts

patch(OrderWidget.prototype, {
    /**
     * Add supplement popup functionality to OrderWidget
     */

    /**
     * Open supplement selection popup (legacy method, kept for compatibility)
     */
    async _openSupplementPopup(orderline) {
        const productsToDisplay = this._get_by_categ(orderline);
        
                try {
            // Get the actual PosOrderline object from the order
            const pos = this.env.services.pos;
            const order = pos.get_order();
            const actualOrderline = order.get_selected_orderline();
            
            console.log('🔧 Opening popup with orderline:', orderline);
            console.log('🔧 Actual PosOrderline object:', actualOrderline);
            
            const result = await makeAwaitable(this.env.services.dialog, CategoryProductAccPopup, {
                productsToDisplay: productsToDisplay,
                orderline: actualOrderline, // Pass the actual PosOrderline object
            });
            
            if (result && result.confirmed) {
                console.log('Supplements selected:', result.products);
            }
        } catch (error) {
            console.error('Error opening supplement popup:', error);
        }
    },

    /**
     * Get products organized by accompaniment categories
     */
    _get_by_categ(orderline) {
        const accompanimentCategoryIds = {};
        
        // Safety check: ensure pos and models are loaded
        if (!this.env.pos || !this.env.pos.models || !this.env.pos.models["pos.category"]) {
            console.warn('POS data not fully loaded yet');
            return accompanimentCategoryIds;
        }
        
        try {
            // Get all categories and filter for accompaniment categories
            const categories = this.env.pos.models["pos.category"].getAll();
            
            for (const category of categories) {
                // Check if the category has 'is_accompaniment' set to true
                if (category && category.is_accompaniment) {
                    accompanimentCategoryIds[category.name] = {
                        id: category.id,
                        products: this._product_per_category(orderline, category.id),
                    };
                }
            }
        } catch (error) {
            console.error('Error getting accompaniment categories:', error);
        }
        
        return accompanimentCategoryIds;
    },

    /**
     * Get products for a specific category
     */
    _product_per_category(orderline, category_id) {
        const products = [];
        
        // Safety check
        if (!this.env.pos || !this.env.pos.models || !this.env.pos.models["product.product"]) {
            console.warn('Product data not fully loaded yet');
            return products;
        }
        
        try {
            const acc_line = orderline && orderline.accompaniment_ids ? 
                orderline.accompaniment_ids.map(acc => acc.product_id) : [];
                
            // Get all products and filter by category
            const allProducts = this.env.pos.models["product.product"].getAll();
            const categoryProducts = allProducts.filter(product => 
                product && product.pos_categ_ids && product.pos_categ_ids.includes(category_id)
            );
            
            categoryProducts.forEach(product => {
                const image_url = window.location.origin + '/web/image?model=product.product&field=image_medium&id=' + product.id;
                // Create a copy to avoid modifying original product data
                const productCopy = { ...product };
                productCopy.image_url = image_url;
                
                if (acc_line.includes(product.id)) {
                    productCopy.selected = true;
                } else {
                    productCopy.selected = false;
                }
                
                products.push(productCopy);
            });
        } catch (error) {
            console.error('Error getting products for category:', error);
        }
        
        return products;
    }
});
