/** @odoo-module */

import { PosOrder } from "@point_of_sale/app/models/pos_order";
import { PosOrderline } from "@point_of_sale/app/models/pos_order_line";
import { patch } from "@web/core/utils/patch";

// Patch POS Order model
patch(PosOrder.prototype, {
    /**
     * Get total number of accompaniments in the order
     */
    get_accompaniment_count() {
        let count = 0;
        this.get_orderlines().forEach(line => {
            if (line.accompaniment_ids) {
                count += line.accompaniment_ids.length;
            }
        });
        return count;
    },
    
    /**
     * Get total amount of all accompaniments in the order
     */
    get_total_accompaniment_amount() {
        let total = 0;
        this.get_orderlines().forEach(line => {
            if (line.accompaniment_ids) {
                line.accompaniment_ids.forEach(acc => {
                    total += acc.quantity * acc.price_unit;
                });
            }
        });
        return total;
    }
});

// Patch POS Orderline model
patch(PosOrderline.prototype, {
    /**
     * Initialize orderline with accompaniment support
     */
    init_from_JSON(json) {
        super.init_from_JSON(json);
        this.accompaniment_ids = json.accompaniment_ids || [];
        this.accompaniment_note = json.accompaniment_note || '';
        this.accompaniment_total = json.accompaniment_total || 0;
    },
    
    /**
     * Export orderline data for backend
     */
    export_as_JSON() {
        const json = super.export_as_JSON();
        json.accompaniment_ids = this.accompaniment_ids || [];
        json.accompaniment_note = this.accompaniment_note || '';
        json.accompaniment_total = this.accompaniment_total || 0;
        return json;
    },
    
    /**
     * Get display name for the orderline
     */
    get_display_name() {
        let name = this.get_product().display_name;
        if (this.accompaniment_note) {
            name += ' (' + this.accompaniment_note + ')';
        }
        return name;
    },
    
    /**
     * Get total price including accompaniments
     */
    get_price_with_tax() {
        const base_price = super.get_price_with_tax();
        const accompaniment_total = this.accompaniment_total || 0;
        return base_price + accompaniment_total;
    },
    
    /**
     * Get total price without tax including accompaniments
     */
    get_price_without_tax() {
        const base_price = super.get_price_without_tax();
        const accompaniment_total = this.accompaniment_total || 0;
        return base_price + accompaniment_total;
    }
}); 