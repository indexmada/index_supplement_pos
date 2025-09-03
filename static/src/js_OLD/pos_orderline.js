/** @odoo-module */

import { PosOrderline } from "@point_of_sale/app/models/pos_order_line";
import { patch } from "@web/core/utils/patch";

patch(PosOrderline.prototype, {
    /**
     * Initialize accompaniment-related fields
     */
    init_from_JSON(json) {
        super.init_from_JSON(json);
        this.accompaniment_ids = json.accompaniment_ids || [];
        this.accompaniment_note = json.accompaniment_note || '';
        this.accompaniment_total = json.accompaniment_total || 0;
        this.has_accompaniments = json.has_accompaniments || false;
    },

    /**
     * Export accompaniment data to JSON
     */
    export_as_JSON() {
        const json = super.export_as_JSON();
        json.accompaniment_ids = this.accompaniment_ids || [];
        json.accompaniment_note = this.accompaniment_note || '';
        json.accompaniment_total = this.accompaniment_total || 0;
        json.has_accompaniments = this.has_accompaniments || false;
        return json;
    },

    /**
     * Add accompaniments to this orderline
     */
    add_accompaniments(accompaniments) {
        console.log('🔧 [PosOrderline] Adding accompaniments:', accompaniments);
        
        if (!this.accompaniment_ids) {
            this.accompaniment_ids = [];
        }
        
        // Add new accompaniments
        this.accompaniment_ids.push(...accompaniments);
        
        console.log('🔧 [PosOrderline] Updated accompaniment_ids:', this.accompaniment_ids);
        
        // Update notes and recalculate price
        this._update_accompaniment_notes();
        this._recalculate_price();
        
        console.log('🔧 [PosOrderline] Accompaniments added successfully');
    },

    /**
     * Update accompaniment notes based on current accompaniments
     */
    _update_accompaniment_notes() {
        if (this.accompaniment_ids && this.accompaniment_ids.length > 0) {
            const names = this.accompaniment_ids.map(acc => acc.name);
            this.accompaniment_note = names.join(', ');
            this.has_accompaniments = true;
        } else {
            this.accompaniment_note = '';
            this.has_accompaniments = false;
        }
        
        console.log('🔧 [PosOrderline] Updated accompaniment note:', this.accompaniment_note);
    },

    /**
     * Recalculate price including accompaniments
     */
    _recalculate_price() {
        // Calculate accompaniment total
        this.accompaniment_total = 0;
        if (this.accompaniment_ids && this.accompaniment_ids.length > 0) {
            this.accompaniment_total = this.accompaniment_ids.reduce((total, acc) => {
                const price = parseFloat(acc.price) || 0;
                const quantity = parseFloat(acc.quantity) || 1;
                const lineTotal = price * quantity;
                console.log(`🔧 [PosOrderline] Accompaniment calculation: ${acc.name} = ${price} × ${quantity} = ${lineTotal}`);
                return total + lineTotal;
            }, 0);
        }
        
        console.log('🔧 [PosOrderline] Recalculated accompaniment total:', this.accompaniment_total);
    },

    /**
     * Get base price without accompaniments
     */
    get_base_price() {
        return this.get_price_with_tax() - this.accompaniment_total;
    },

    /**
     * Get price with tax including accompaniments
     */
    get_price_with_tax() {
        const basePrice = super.get_price_with_tax();
        const accompanimentTotal = this.accompaniment_total || 0;
        const totalPrice = basePrice + accompanimentTotal;
        
        // Debug: Only log when accompaniments are present
        if (this.accompaniment_ids && this.accompaniment_ids.length > 0) {
            console.log('🔧 [PosOrderline] Price calculation with accompaniments:', {
                basePrice: basePrice,
                accompanimentTotal: accompanimentTotal,
                totalPrice: totalPrice,
                accompaniment_count: this.accompaniment_ids.length
            });
        }
        
        return totalPrice;
    },

    /**
     * Get accompaniment count
     */
    get_accompaniment_count() {
        return this.accompaniment_ids ? this.accompaniment_ids.length : 0;
    },

    /**
     * Get total accompaniment amount
     */
    get_total_accompaniment_amount() {
        return this.accompaniment_total || 0;
    }
});
