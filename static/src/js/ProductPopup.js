odoo.define('index_supplement_pos.ProductPopup', function(require) {
    'use strict';

    var ScreenWidget = require('point_of_sale.screens')
    var ScreenWidget = ScreenWidget.ScreenWidget;
    var gui = require('point_of_sale.gui');
    var categoryProductAcc = ScreenWidget.extend({
        template: 'CategoryProductAcc',
        events: {
            'click .cancel':  'cancel',
            'click .confirm':  'confirm',
            'click .oe_click_product': 'OnClickProduct',
        },

        show: function(options){
            var self = this;
            options = options || {};

            self._super(options);

            self.confirmText = options.confirmText || 'Confirm';
            self.title = options.title || 'Select supplement';
            self.productsToDisplay = options.productsToDisplay || [];
            self.orderline = options.orderline || null;
            self.renderElement();
        },

        _initializedContentData: function(){
            this.renderElement();
            this.pos.gui.close_popup();
        },

        _get_all_product: function(){
            var products = [];
            Object.entries(this.productsToDisplay).forEach(([key, value]) => {
                products.push(value.products);
            });
            return products.reduce((acc, val) => acc.concat(val), []); ;
        },

        confirm: function(){
            var products = this._get_all_product();
            const product_selected = products.filter(p => p.selected == true);
            this.onAddAccompanimentClick(product_selected);
            this.pos.gui.close_popup();
        },

        cancel: function(){
            this._initializedContentData();
        },

        onAddAccompanimentClick: function(products=[]) {
            var order = this.pos.get_order();
            var selected_line = order.get_selected_orderline();
            var lines = []
            if (selected_line) {
                products.forEach(product => {
                    var new_accompaniment = {
                        line_id: selected_line.id,
                        quantity: 1,
                        name: product.display_name,
                        price: product.lst_price,
                        status: 'new',
                        product_id: product.id,
                    };
                    lines.push(new_accompaniment);
                });
                selected_line.add_accompaniment(lines)
                selected_line._update_accompaniment_notes()
            }
        },

        OnClickProduct: function(article){
            var data = article.currentTarget.dataset
            const productID = data.productId || null;
            if (!productID) return;
            var orderline = data.orderlineId || null;
            var products = this._get_all_product();
            var product = products.find(p => p.id == parseInt(productID));
            if (product.selected){
                product.selected = false;
            } else {
                product.selected = true;
            }
            product.orderline = parseInt(orderline);
            this.renderElement();   
        },
    });
    gui.define_popup({name:'CategoryProductAcc', widget: categoryProductAcc});
    
 });
 