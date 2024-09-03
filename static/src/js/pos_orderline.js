odoo.define('index_supplement_pos.pos_orderline', function (require) {
"use strict";

    var models = require('point_of_sale.models');
    var screens = require('point_of_sale.screens');
    var core = require('web.core');

    var QWeb = core.qweb;
    var _t   = core._t;

    var _super_orderline = models.Orderline.prototype;

    // models.load_models({
    //     model: "pos.accompaniment.line",
    //     domain: [],
    //     fields: ['name','quantity','line_id', 'status', 'price'],
    //     loaded: function(self, acc_lines){
    //         var lines = []
    //         acc_lines.forEach((line) => {
    //             lines.push({
    //                 'name': line.name,
    //                 'quantity': line.quantity,
    //                 'line_id': line.line_id,
    //                 'status': line.status,
    //                 'price': line.price,
    //             });
    //         });
    //         self.pos_accompaniment = lines;
    //     }}, 
    //     {
    //     'after': "pos.order.line"
    // });


    models.load_fields('pos.category', 'is_accompaniment');

    models.load_fields('pos.order.line', ['accompaniment_ids', "accompaniment_note"]);

    models.Orderline = models.Orderline.extend({

        initialize: function(attr, options) {
            _super_orderline.initialize.call(this,attr,options);
            this.accompaniment_ids = this.accompaniment_ids || [];
            this.accompaniment_note = this.accompaniment_note || "";
        },

        export_as_JSON: function() {
            var json = _super_orderline.export_as_JSON.call(this);
            json.accompaniment_ids = this.accompaniment_ids;
            json.accompaniment_note = this.accompaniment_note;
            return json;
        },

        init_from_JSON: function(json) {
            _super_orderline.init_from_JSON.call(this, json);
            this.accompaniment_ids = json.accompaniment_ids || [];
            this.accompaniment_note = json.accompaniment_note || "";
        },

        /**
         * Adds an accompaniment to the accompaniment_ids field.
         *
         * @param {Object} accompaniment - The accompaniment object to be added.
         */
        add_accompaniment: function(accompaniment) {
            this.accompaniment_ids = [];
            this.accompaniment_ids = accompaniment;
            this._recalculate_price();
            this.trigger('change', this);
        },

        _update_accompaniment_notes: function() {
            var order = this.pos.get_order();
            var selected_line = order.get_selected_orderline();
            if (selected_line) {
                var accompaniments = selected_line.accompaniment_ids
                this.map_accompaniments(selected_line, accompaniments);
            }
            else {
                order.orderlines.models.forEach(element => {
                    var acc = element.accompaniment_ids;
                    if (acc.length > 0) {
                        this.map_accompaniments(element, element.accompaniment_ids);
                    }
                });
            }
        },

        map_accompaniments: function(orderline, accompaniments) {
            if (orderline && accompaniments) {
                var notes = accompaniments.map(function(acc) {
                    return acc.name;
                }).join(" + ");
                orderline.accompaniment_note = notes;
                this.trigger('change', this);
            }
        },

        _recalculate_price: function() {
            var total_accompaniment_price = this.accompaniment_ids.reduce(function(total, accompaniment) {
                return total + (accompaniment.price * accompaniment.quantity);
            }, 0);

            // Reset the price to base price and then add accompaniments
            this.price = this.get_base_price() + total_accompaniment_price;
        },
    });
});
