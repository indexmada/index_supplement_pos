odoo.define('index_supplement_pos.screems', function (require) {
    var core    = require('web.core');
    var screens = require('point_of_sale.screens');
    var _t = core._t;

    screens.OrderWidget.include({

        render_orderline: function(orderline){
            var el_node = this._super(orderline);
            var self = this;
            el_node.querySelector('.btn-acc').addEventListener('click', () => {
                self.gui.show_popup("CategoryProductAcc", {
                    title : _t("Select supplement"),
                    confirmText: _t("Save"),
                    productsToDisplay: self._get_by_categ(orderline),
                    orderline: orderline.id,
                });
            })
            return el_node;
        },

        _get_by_categ: function(orderline){
            var accompanimentCategoryIds = {};
            // Iterate over each entry in the category_by_id object
            for (var categoryId in this.pos.db.category_by_id) {
                if (this.pos.db.category_by_id.hasOwnProperty(categoryId)) {
                    var category = this.pos.db.category_by_id[categoryId];
                    
                    // Check if the category has 'is_accompaniment' set to true
                    if (category.is_accompaniment) {
                        const $id = parseInt(categoryId);
                        accompanimentCategoryIds[category.name] = {
                            id: $id,
                            products: this._product_per_category(orderline, $id),
                        };
                    }
                }
            }
            return accompanimentCategoryIds;
        },

        _product_per_category: function(orderline, category_id) {
            var products = [];
            var acc_line = orderline.accompaniment_ids.map(acc => acc.product_id);
            this.pos.db.get_product_by_category(category_id).forEach(product => {
                var image_url = window.location.origin + '/web/image?model=product.product&field=image_medium&id=' + product.id;
                product['image_url'] = image_url;
                products.push(product);
                if (acc_line.includes(product.id)){
                    product['selected'] = true;
                } else {
                    product['selected'] = false;
                }
            });
            return products;
        }
    });
});
