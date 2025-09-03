/** @odoo-module */

import { Component, useState } from "@odoo/owl";
import { Dialog } from "@web/core/dialog/dialog";

export class SupplementPopup extends Component {
    static template = "index_supplement_pos.SupplementPopup";
    static components = { Dialog };
    static props = {
        getPayload: Function,
        close: Function,
    };
    
    setup() {
        this.state = useState({
            searchTerm: '',
            selectedItems: new Map(),
        });
    }
    
    // Simple confirm method for testing
    confirm() {
        alert('Supplement popup confirmed!');
        this.props.getPayload({ confirmed: true });
        this.props.close();
    }
    
    // Simple cancel method
    cancel() {
        this.props.getPayload({ confirmed: false });
        this.props.close();
    }
    
    // Simple search method for testing
    onSearchChange(ev) {
        this.state.searchTerm = ev.target.value;
    }
}

// Global function for handling supplement button clicks
window.handleSupplementClick = function(ev, productName, accompanimentCount) {
    if (ev) {
        ev.stopPropagation();
    }
    
    const name = productName || 'Unknown Product';
    const count = accompanimentCount || 0;
    
    console.log('Supplement button clicked for:', name, 'with', count, 'supplements');
    alert(`Opening supplement selection for: ${name}\n(Current: ${count} supplements)`);
    
    // TODO: Later, open the actual popup
    // const popup = this.env.services.popup;
    // popup.add(SupplementPopup, { orderline: line });
}; 