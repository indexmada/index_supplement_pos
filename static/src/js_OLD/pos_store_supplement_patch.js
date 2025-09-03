/** @odoo-module */

import { PosOrder } from "@point_of_sale/app/models/pos_order";
import { patch } from "@web/core/utils/patch";

console.log('🚀 POS Supplement Patch module loaded');

patch(PosOrder.prototype, {
    /**
     * @override
     * Étend export_for_printing pour inclure les données des suppléments
     * Compatible avec le module indx_pos_floor_table
     */
    export_for_printing(baseUrl, headerData) {
        try {
            console.log('🔍 [Debug] export_for_printing called for order:', this.id || 'new');
        const receipt = super.export_for_printing(baseUrl, headerData);
        
        // Ajouter les données des suppléments pour chaque ligne
        console.log('🔍 [Debug] Receipt structure:', Object.keys(receipt));
        console.log('🔍 [Debug] Receipt orderlines:', receipt.orderlines);
        console.log('🔍 [Debug] Receipt orderlines type:', typeof receipt.orderlines);
        console.log('🔍 [Debug] Receipt orderlines length:', receipt.orderlines?.length);
        
        if (receipt.orderlines && Array.isArray(receipt.orderlines) && receipt.orderlines.length > 0) {
            console.log('🔍 [Debug] Processing', receipt.orderlines.length, 'orderlines for supplements');
            
            receipt.orderlines = receipt.orderlines.map(line => {
                console.log('🔍 [Debug] Processing line:', line.uuid, 'product:', line.productName);
                console.log('🔍 [Debug] Line object keys:', Object.keys(line));
                console.log('🔍 [Debug] Available lines in order:', this.lines.length);
                console.log('🔍 [Debug] Available line UUIDs:', this.lines.map(l => l.uuid));
                
                // Récupérer la ligne originale pour accéder aux suppléments
                // Essayer plusieurs méthodes de correspondance
                let originalLine = null;
                
                // Méthode 1: Par UUID (le plus fiable)
                if (line.uuid) {
                    originalLine = this.lines.find(l => l.uuid === line.uuid);
                    console.log('🔍 [Debug] UUID match result:', !!originalLine);
                }
                
                // Méthode 2: Par ID si UUID échoue
                if (!originalLine && line.id) {
                    originalLine = this.lines.find(l => l.id === line.id);
                    console.log('🔍 [Debug] ID match result:', !!originalLine);
                }
                
                // Méthode 3: Par nom de produit et quantité (fallback)
                if (!originalLine) {
                    originalLine = this.lines.find(l => {
                        const nameMatch = l.product_id && l.product_id.name === line.productName;
                        // Corriger le problème de quantity undefined
                        const originalQty = l.quantity || l.qty || 1;
                        const receiptQty = parseFloat(line.qty) || 1;
                        const qtyMatch = Math.abs(originalQty - receiptQty) < 0.001;
                        console.log('🔍 [Debug] Fallback match - name:', nameMatch, 'qty:', qtyMatch, 'for product:', l.product_id?.name);
                        console.log('🔍 [Debug] Fallback match - original qty:', originalQty, 'receipt qty:', receiptQty);
                        console.log('🔍 [Debug] Fallback match - qty difference:', Math.abs(originalQty - receiptQty));
                        console.log('🔍 [Debug] Fallback match - qty types:', typeof originalQty, typeof receiptQty);
                        return nameMatch && qtyMatch;
                    });
                    console.log('🔍 [Debug] Fallback match result:', !!originalLine);
                }
                
                // Méthode 4: Par nom de produit seulement (dernier recours)
                if (!originalLine) {
                    originalLine = this.lines.find(l => {
                        const nameMatch = l.product_id && l.product_id.name === line.productName;
                        console.log('🔍 [Debug] Name-only match - name:', nameMatch, 'for product:', l.product_id?.name);
                        return nameMatch;
                    });
                    console.log('🔍 [Debug] Name-only match result:', !!originalLine);
                }
                
                console.log('🔍 [Debug] Original line found:', !!originalLine);
                if (originalLine) {
                    console.log('🔍 [Debug] Original line UUID:', originalLine.uuid);
                }
                
                if (originalLine) {
                    console.log('🔍 [Debug] Original line found, checking accompaniments...');
                    console.log('🔍 [Debug] Original line accompaniment_ids:', originalLine.accompaniment_ids);
                    console.log('🔍 [Debug] Original line accompaniment_ids type:', typeof originalLine.accompaniment_ids);
                    console.log('🔍 [Debug] Original line accompaniment_ids length:', originalLine.accompaniment_ids?.length);
                    
                    // Vérifier si la ligne a des suppléments
                    const hasAccompaniments = originalLine.accompaniment_ids && 
                                            Array.isArray(originalLine.accompaniment_ids) && 
                                            originalLine.accompaniment_ids.length > 0;
                    
                    if (hasAccompaniments) {
                        console.log('🔍 [Debug] Line has accompaniments, processing...');
                        // NOUVEAU: Utiliser les méthodes formatées pour un affichage optimal
                        line.accompaniments = originalLine.get_formatted_accompaniments_for_receipt();
                        line.accompaniment_total = originalLine.get_total_accompaniment_amount();
                        line.accompaniment_total_formatted = originalLine.get_formatted_accompaniment_total();
                        line.has_accompaniments = true;
                        
                        // NOUVEAU: Ajouter le texte formaté pour l'affichage dans les notes
                        line.accompaniments_note = originalLine.get_accompaniments_as_note_text();
                        
                        console.log('🔧 [Supplement Patch] Added formatted accompaniments to line:', {
                        product: line.productName,
                        accompaniments: line.accompaniments,
                            total: line.accompaniment_total,
                            note: line.accompaniments_note
                        });
                    } else {
                        console.log('🔍 [Debug] No accompaniments for line:', line.uuid);
                        console.log('🔍 [Debug] Accompaniment_ids value:', originalLine.accompaniment_ids);
                    }
                } else {
                    console.log('🔍 [Debug] No original line found for:', line.uuid);
                }
                return line;
            });
        } else {
            console.log('🔍 [Debug] No orderlines in receipt');
            console.log('🔍 [Debug] Available lines in order:', this.lines.length);
            console.log('🔍 [Debug] Lines with accompaniments:', this.lines.filter(l => l.accompaniment_ids && l.accompaniment_ids.length > 0).length);
        }
        
        // Debug supplémentaire : vérifier toutes les lignes de la commande
        console.log('🔍 [Debug] All order lines debug:');
        this.lines.forEach((line, index) => {
            console.log(`🔍 [Debug] Line ${index}:`, {
                uuid: line.uuid,
                product: line.product_id?.name,
                accompaniment_ids: line.accompaniment_ids,
                accompaniment_ids_type: typeof line.accompaniment_ids,
                accompaniment_ids_length: line.accompaniment_ids?.length
            });
        });
        
        return receipt;
        } catch (error) {
            console.error('❌ [Supplement Patch] Error in export_for_printing:', error);
            // En cas d'erreur, retourner le résultat de la méthode parent
            return super.export_for_printing(baseUrl, headerData);
        }
    },

    /**
     * @override
     * Étend getOrderChanges pour inclure les suppléments dans les tickets de cuisine
     * Compatible avec le module indx_pos_floor_table
     */
    getOrderChanges(skipped = false) {
        try {
            console.log('🔍 [Debug] getOrderChanges called for order:', this.id || 'new');
        const changes = super.getOrderChanges(skipped);
        
        // Ajouter les suppléments aux lignes de changement
        if (changes.new) {
            changes.new = changes.new.map(line => {
                const originalLine = this.lines.find(l => l.uuid === line.uuid);
                if (originalLine && originalLine.accompaniment_ids && originalLine.accompaniment_ids.length > 0) {
                    // NOUVEAU: Utiliser les méthodes formatées pour un affichage optimal
                    line.accompaniments = originalLine.get_formatted_accompaniments_for_receipt();
                    line.accompaniment_total = originalLine.get_total_accompaniment_amount();
                    line.accompaniment_total_formatted = originalLine.get_formatted_accompaniment_total();
                    line.has_accompaniments = true;
                    
                    // NOUVEAU: Ajouter le texte formaté pour l'affichage dans les notes
                    line.accompaniments_note = originalLine.get_accompaniments_as_note_text();
                    
                    console.log('🔧 [Supplement Patch] Added formatted accompaniments to change line:', {
                        product: line.display_name || line.name,
                        accompaniments: line.accompaniments,
                        total: line.accompaniment_total,
                        note: line.accompaniments_note
                    });
                }
                return line;
            });
        }
        
        if (changes.removed) {
            changes.removed = changes.removed.map(line => {
                const originalLine = this.lines.find(l => l.uuid === line.uuid);
                if (originalLine && originalLine.accompaniment_ids && originalLine.accompaniment_ids.length > 0) {
                    // NOUVEAU: Utiliser les méthodes formatées pour un affichage optimal
                    line.accompaniments = originalLine.get_formatted_accompaniments_for_receipt();
                    line.accompaniment_total = originalLine.get_total_accompaniment_amount();
                    line.accompaniment_total_formatted = originalLine.get_formatted_accompaniment_total();
                    line.has_accompaniments = true;
                    
                    // NOUVEAU: Ajouter le texte formaté pour l'affichage dans les notes
                    line.accompaniments_note = originalLine.get_accompaniments_as_note_text();
                    
                    console.log('🔧 [Supplement Patch] Added formatted accompaniments to removed line:', {
                        product: line.display_name || line.name,
                        accompaniments: line.accompaniments,
                        total: line.accompaniment_total,
                        note: line.accompaniments_note
                    });
                }
                return line;
            });
        }
        
        // NOUVEAU: Ajouter les suppléments aux lignes de changement standard
        if (changes.orderlines) {
            Object.keys(changes.orderlines).forEach(key => {
                const line = changes.orderlines[key];
                const originalLine = this.lines.find(l => l.uuid === line.uuid);
                if (originalLine && originalLine.accompaniment_ids && originalLine.accompaniment_ids.length > 0) {
                    // NOUVEAU: Utiliser les méthodes formatées pour un affichage optimal
                    line.accompaniments = originalLine.get_formatted_accompaniments_for_receipt();
                    line.accompaniment_total = originalLine.get_total_accompaniment_amount();
                    line.accompaniment_total_formatted = originalLine.get_formatted_accompaniment_total();
                    line.has_accompaniments = true;
                    
                    // NOUVEAU: Ajouter le texte formaté pour l'affichage dans les notes
                    line.accompaniments_note = originalLine.get_accompaniments_as_note_text();
                    
                    console.log('🔧 [Supplement Patch] Added formatted accompaniments to orderline change:', {
                        product: line.display_name || line.name,
                        accompaniments: line.accompaniments,
                        total: line.accompaniment_total,
                        note: line.accompaniments_note
                    });
                }
            });
        }
        
        return changes;
        } catch (error) {
            console.error('❌ [Supplement Patch] Error in getOrderChanges:', error);
            // En cas d'erreur, retourner le résultat de la méthode parent
            return super.getOrderChanges(skipped);
        }
    },

    /**
     * NOUVEAU: Méthode pour exporter les données des suppléments pour les tickets de cuisine
     * Compatible avec tous les modules de tickets
     */
    export_supplements_for_kitchen_receipt() {
        const supplementsData = {};
        
        this.lines.forEach(line => {
            if (line.accompaniment_ids && line.accompaniment_ids.length > 0) {
                supplementsData[line.uuid] = {
                    uuid: line.uuid,
                    product_name: line.get_full_product_name(),
                    accompaniments: line.get_formatted_accompaniments_for_receipt(),
                    accompaniment_total: line.get_total_accompaniment_amount(),
                    accompaniment_total_formatted: line.get_formatted_accompaniment_total(),
                    accompaniments_note: line.get_accompaniments_as_note_text(),
                    has_accompaniments: true
                };
            }
        });
        
        console.log('🔧 [Supplement Patch] Kitchen receipt supplements data:', supplementsData);
        return supplementsData;
    }
});
