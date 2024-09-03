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
                    productsToDisplay: self.productsToDisplay(orderline),
                    orderline: orderline.id,
                });
            })
            return el_node;
        },

        productsToDisplay(orderline) {
            const categAccFilter = this.pos.product_categories.filter(categ => categ.is_accompaniment).map(categ => categ.id);
            var products = [];
            var acc_line = orderline.accompaniment_ids.map(acc => acc.product_id);
            categAccFilter.forEach(categ => {
                this.pos.db.get_product_by_category(categ).forEach(product => {
                    var image_url = window.location.origin + '/web/image?model=product.product&field=image_medium&id=' + product.id;
                    product['image_url'] = image_url;
                    products.push(product);
                    if (acc_line.includes(product.id)){
                        product['selected'] = true;
                    } else {
                        product['selected'] = false;
                    }
                });
            });
            return products;
        }
    });
});
