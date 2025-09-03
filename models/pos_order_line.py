# -*- coding: utf-8 -*-

from odoo import models, fields, api


class PosOrderLine(models.Model):
    _inherit = 'pos.order.line'
    
    accompaniment_ids = fields.One2many(
        'pos.accompaniment.line',
        'line_id',
        string='Accompaniments'
    )
    accompaniment_note = fields.Text(string='Accompaniment Note')
    
    # Computed fields
    accompaniment_total = fields.Float(
        string='Accompaniment Total',
        compute='_compute_accompaniment_total',
        store=True
    )
    
    has_accompaniments = fields.Boolean(
        string='Has Accompaniments',
        compute='_compute_has_accompaniments',
        store=True
    )
    
    @api.depends('accompaniment_ids', 'accompaniment_ids.total_price')
    def _compute_accompaniment_total(self):
        """Compute the total price of all accompaniments"""
        for line in self:
            line.accompaniment_total = sum(
                accompaniment.total_price 
                for accompaniment in line.accompaniment_ids
            )
    
    @api.depends('accompaniment_ids')
    def _compute_has_accompaniments(self):
        """Check if the order line has accompaniments"""
        for line in self:
            line.has_accompaniments = bool(line.accompaniment_ids)
    
    def _update_accompaniment_notes(self):
        """Update accompaniment notes and standard note field for kitchen display"""
        for line in self:
            if line.accompaniment_ids:
                # Generate accompaniment note text
                accompaniment_names = []
                for acc in line.accompaniment_ids:
                    name = acc.name
                    if acc.quantity != 1:
                        name += f" x{acc.quantity}"
                    if acc.price > 0:
                        name += f" (+{acc.price:.0f} Ar)"
                    accompaniment_names.append(name)
                
                accompaniment_text = ", ".join(accompaniment_names)
                
                # Update accompaniment_note field
                line.accompaniment_note = accompaniment_text
                
                # Update standard note field for kitchen/receipt display
                if accompaniment_text:
                    base_note = line.note or ""
                    
                    # Remove existing supplement info from note
                    if "Suppléments:" in base_note:
                        base_note = base_note.split("Suppléments:")[0].strip()
                    
                    # Add supplement info to note
                    new_note = f"Suppléments: {accompaniment_text}"
                    if base_note:
                        new_note = f"{base_note}\n{new_note}"
                    
                    line.note = new_note
            else:
                # Clear accompaniment notes if no accompaniments
                line.accompaniment_note = ""
                
                # Remove supplement info from note if present
                if line.note and "Suppléments:" in line.note:
                    base_note = line.note.split("Suppléments:")[0].strip()
                    line.note = base_note or ""
    
    @api.model
    def create(self, vals):
        """Override create to handle accompaniments from UI"""
        # Extract accompaniment data if present
        accompaniment_data = vals.pop('accompaniment_ids', [])
        
        # Create the order line
        line = super().create(vals)
        
        # Process accompaniments
        if accompaniment_data:
            line._process_accompaniments(accompaniment_data)
        
        return line
    
    def write(self, vals):
        """Override write to handle accompaniments from UI"""
        # Extract accompaniment data if present
        accompaniment_data = vals.pop('accompaniment_ids', None)
        
        # Update the order line
        result = super().write(vals)
        
        # Process accompaniments
        if accompaniment_data is not None:
            for line in self:
                line._process_accompaniments(accompaniment_data)
        
        return result
    
    def _process_accompaniments(self, accompaniment_data):
        """Process accompaniment data from UI"""
        # Clear existing accompaniments
        self.accompaniment_ids.unlink()
        
        # Create new accompaniments
        for acc_data in accompaniment_data:
            if isinstance(acc_data, dict):
                acc_data['line_id'] = self.id
                self.env['pos.accompaniment.line'].create(acc_data)
        
        # Update notes after processing accompaniments
        self._update_accompaniment_notes()
