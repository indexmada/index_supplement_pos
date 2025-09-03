/** @odoo-module */

console.log('🚀 POS Supplement Screens (Minimal Version) loaded');

// Version minimale pour éviter les conflits au démarrage
// Les fonctionnalités avancées seront réactivées après les tests de base

// Global function for handling supplement popup (simple version)
window.openSupplementPopup = function(ev, orderline) {
    if (ev) {
        ev.stopPropagation();
    }
    
    console.log('Supplement button clicked for orderline:', orderline);
    alert(`Supplement popup for: ${orderline?.product?.display_name || 'Unknown product'}\n\nMinimal version - functionality will be restored after basic tests.`);
};

window.handleSupplementClick = window.openSupplementPopup;
