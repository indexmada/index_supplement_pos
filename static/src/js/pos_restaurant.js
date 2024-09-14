odoo.define('index_supplement_pos.pos_restaurant', function (require) {
    "use strict";

    var models = require('point_of_sale.models');

    var _super_postmodern = models.PosModel.prototype;
    models.PosModel = models.PosModel.extend({
        initialize: function(session, attributes) {
            return _super_postmodern.initialize.call(this,session,attributes);
        },

        // changes the current table.
        /*
        *@override
        * replace methode to avoid the guest popup when we change the table
        * @param {Object} table
        */
        set_table: async function(table) {
            var self = this;
            // return super when required guest isn't set
            if (!self.config.required_guest_on_table) {
                return _super_postmodern.set_table.call(this, table);
            }
            if (!table) { // no table ? go back to the floor plan, see ScreenSelector
                self.set_order(null);
            } else if (self.order_to_transfer_to_different_table) {
                self.order_to_transfer_to_different_table.table = table;
                self.order_to_transfer_to_different_table.save_to_db();
                self.order_to_transfer_to_different_table = null;
    
                // set this table
                self.set_table(table);
            } else {
                self.table = table;
                var orders = self.get_order_list();
                if (orders.length) {
                    var $order = orders[0]
                    self.gui.show_popup('number', {
                        'title':  _t('Guests ?'),
                        'cheap': true,
                        'value':   $order.customer_count || 1,
                        'confirm': function(value) {
                            value = Math.max(1, Number(value));
                            self._set_current_order_after_guests(value, $order);
                        },
                    });
                } else {
                    self.gui.show_popup('number', {
                        'title':  _t('Guests ?'),
                        'cheap': true,
                        'value': 1,
                        'confirm': (value) => {
                            value = Math.max(1, Number(value));
                            self.add_new_order();
                            var newOrder = self.get_order_list();
                            var selectedOrder = newOrder[0];
                            selectedOrder.set_customer_count(value);
                        },
                    });
                }
            }
        },   
        
        // changes the current order.
        _set_current_order_after_guests: function(value, order) {
            this.set_order(order);
            order.set_customer_count(value);
        }
    });
});