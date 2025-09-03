/** @odoo-module */

console.log('🚀 POS Restaurant Integration (Minimal Version) loaded');

// Version minimale qui évite tous les conflits avec pos_restaurant
// Aucun patch actif pour éviter les erreurs de setup

// Fonction utilitaire globale pour la détection des changements
window.forceSupplementChangeDetection = function(order) {
    if (order && order.trigger && typeof order.trigger === 'function') {
        order.trigger('change', order);
        console.log('✅ Supplement change detection triggered');
    }
};

console.log('✅ POS Restaurant Integration (Minimal) - No patches applied');
