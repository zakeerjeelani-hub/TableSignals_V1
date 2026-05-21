// import { Component } from '@angular/core';

// @Component({
//   selector: 'app-save-template-dialog',
//   standalone: true,
//   imports: [],
//   templateUrl: './save-template-dialog.component.html',
//   styleUrl: './save-template-dialog.component.scss'
// })
// export class SaveTemplateDialogComponent {

// }

// ============================================
// SAVE TEMPLATE DIALOG COMPONENT (NEW)
// ============================================

// File: save-template-dialog.component.ts

import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialogModule } from '@angular/material/dialog';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-save-template-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatDialogModule,
    FormsModule
  ],
  templateUrl: './save-template-dialog.component.html',
  styleUrl: './save-template-dialog.component.scss'
})
export class SaveTemplateDialogComponent implements OnInit {
  templateName: string = '';
  errorMessage: string = '';

  constructor(
    public dialogRef: MatDialogRef<SaveTemplateDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {}

  ngOnInit(): void {
    // Pre-fill with existing template name if editing
    if (this.data?.existingName) {
      this.templateName = this.data.existingName;
    }
  }

  validateAndSave(): void {
    this.errorMessage = '';

    // Validation
    if (!this.templateName || !this.templateName.trim()) {
      this.errorMessage = 'Template name is required';
      return;
    }

    if (this.templateName.trim().length < 3) {
      this.errorMessage = 'Template name must be at least 3 characters';
      return;
    }

    if (this.templateName.trim().length > 50) {
      this.errorMessage = 'Template name must not exceed 50 characters';
      return;
    }

    // Return the template name
    this.dialogRef.close(this.templateName.trim());
  }

  cancel(): void {
    this.dialogRef.close();
  }

  // Allow Enter key to submit
  onKeyPress(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      this.validateAndSave();
    }
  }
}