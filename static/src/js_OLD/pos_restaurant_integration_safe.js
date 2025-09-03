/** @odoo-module */

import { PosOrder } from "@point_of_sale/app/models/pos_order";
import { patch } from "@web/core/utils/patch";

console.log('🚀 POS Restaurant Safe Integration for Supplements loaded');

// Version sécurisée qui évite les conflits avec lineToRefund et autres propriétés sensibles
patch(PosOrder.prototype, {
    /**
     * @override
     * S'assurer que uiState est toujours correctement initialisé AVANT l'appel parent
     */
    setup(vals, options) {
        // CRITIQUE : Initialiser uiState AVANT l'appel à super.setup()
        // car l'erreur se produit dans super.setup()
        if (!this.uiState) {
            console.warn('⚠️ [Safe Integration] Pre-initializing uiState before super.setup()');
            this.uiState = {
                lineToRefund: {},
                displayed: true,
                booked: false,
                screen_data: {},
                selected_orderline_uuid: undefined,
                selected_paymentline_uuid: undefined,
                locked: false, // Sera corrigé après super.setup()
                hasChanges: false
            };
        } else if (!this.uiState.lineToRefund) {
            console.warn('⚠️ [Safe Integration] Pre-initializing lineToRefund before super.setup()');
            this.uiState.lineToRefund = {};
        }
        
        try {
            super.setup(vals, options);
        } catch (error) {
            console.error('❌ [Safe Integration] Error in super.setup(), attempting recovery:', error);
            
            // En cas d'erreur dans super.setup(), essayer de récupérer
            if (!this.uiState) {
                this.uiState = {
                    lineToRefund: {},
                    displayed: true,
                    booked: false,
                    screen_data: {},
                    selected_orderline_uuid: undefined,
                    selected_paymentline_uuid: undefined,
                    locked: this.state !== "draft",
                    hasChanges: false
                };
            }
            
            // Re-lancer l'erreur pour que le système puisse la gérer
            throw error;
        }
        
        // Correction post-setup si nécessaire
        if (!this.uiState.lineToRefund) {
            this.uiState.lineToRefund = {};
        }
        
        // Corriger locked après super.setup()
        this.uiState.locked = this.state !== "draft";
    },
    /**
     * NOUVEAU: Méthode pour forcer la détection des changements après ajout de suppléments
     * Version simplifiée qui évite les conflits
     */
    force_change_detection() {
        try {
            console.log('🔧 [Safe Restaurant Integration] Forcing change detection for supplements');
            console.log('🔧 [Safe Restaurant Integration] Order has', this.lines.length, 'lines');
            
            // Déclencher un changement au niveau de la commande
            if (this.trigger && typeof this.trigger === 'function') {
                this.trigger('change', this);
            }
            
            // Si pos_restaurant est présent, marquer comme modifié
            if (this.pos && this.pos.config && this.pos.config.module_pos_restaurant) {
                // S'assurer que uiState existe
                if (!this.uiState) {
                    this.uiState = {
                        lineToRefund: {},
                        hasChanges: false
                    };
                }
                
                // Marquer la commande comme modifiée sans toucher aux autres propriétés
                this.uiState.hasChanges = true;
                
                // Déclencher un événement spécifique pour les suppléments
                if (this.trigger && typeof this.trigger === 'function') {
                    this.trigger('supplement-change', this);
                }
                
                console.log('✅ [Safe Restaurant Integration] Change detection forced for pos_restaurant');
            } else {
                console.log('ℹ️ [Safe Restaurant Integration] pos_restaurant not detected, basic change triggered');
            }
        } catch (error) {
            console.error('❌ [Safe Restaurant Integration] Error in force_change_detection:', error);
        }
    }
});

console.log('✅ POS Restaurant Safe Integration patches applied');
