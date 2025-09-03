/** @odoo-module */

import { patch } from "@web/core/utils/patch";
import { Orderline } from "@point_of_sale/app/generic_components/orderline/orderline";

console.log('🚀 POS Orderline (Minimal Version) loaded');

// Patch pour ajouter la fonction getAccompaniments
patch(Orderline.prototype, {
    /**
     * Récupère les données d'accompagnement pour une ligne de commande
     */
    getAccompaniments() {
        try {
            // Retourner les données d'accompagnement de la ligne
            const line = this.props.line;
            if (line && line.accompaniment_ids) {
                return {
                    accompaniment_ids: line.accompaniment_ids || [],
                    accompaniment_total: line.accompaniment_total || 0
                };
            }
            
            // Valeurs par défaut si pas d'accompagnements
            return {
                accompaniment_ids: [],
                accompaniment_total: 0
            };
        } catch (error) {
            console.warn('Erreur dans getAccompaniments:', error);
            return {
                accompaniment_ids: [],
                accompaniment_total: 0
            };
        }
    },

    /**
     * Ouvre la popup de sélection des suppléments
     */
    openSupplementPopup(ev, line) {
        try {
            if (ev) {
                ev.stopPropagation();
            }
            console.log('Ouverture popup suppléments');
            // TODO: Implémenter l'ouverture de la popup
        } catch (error) {
            console.warn('Erreur ouverture popup:', error);
        }
    }
});

console.log('✅ POS Orderline (Minimal) - Functions added');
