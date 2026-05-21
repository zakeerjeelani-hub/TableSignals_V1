// ============================================
// UPDATED NOTIFICATION DIALOG COMPONENT
// (Checkbox for Send + Save, Button for Save Only)
// ============================================

// File: notification-dialog.component.ts

import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef, MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { RestaurantMembershipusersComponent, MembershipUser, NotificationTemplate } from '../restaurant-membershipusers/restaurant-membershipusers.component';
import { MatCard, MatCardContent, MatCardHeader, MatCardTitle } from '@angular/material/card';
import { RestaurantService } from '../../Services/restaurant.service';
import { SaveTemplateDialogComponent } from '../save-template-dialog/save-template-dialog.component';

@Component({
  selector: 'app-notification-dialog',
  standalone: true,
  imports: [
MatCardHeader,
MatCardTitle,
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatSelectModule,
    MatCheckboxModule,
    MatSnackBarModule,
    MatCard,
    MatCardContent
  ],
  templateUrl: './notification-dialog.component.html',
  styleUrls: ['./notification-dialog.component.scss'],
})
export class NotificationDialogComponent implements OnInit {
  user?: MembershipUser;
  users?: MembershipUser[];
  type: 'details' | 'notification' | 'bulk-notification' | 'edit-template'| 'save-template';
  title: string = '';
  body: string = '';
  selectedTemplate: NotificationTemplate | null = null;
  templates: NotificationTemplate[] = [];
  restaurantId: number = 0;
  isLoading: boolean = false;
  saveAsTemplate: boolean = false;  // Checkbox state for Send + Save

  constructor(
    public dialogRef: MatDialogRef<NotificationDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: {
      user?: MembershipUser;
      users?: MembershipUser[];
      type: 'details' | 'notification' | 'bulk-notification' | 'edit-template';
      restaurantId?: number;
      templates?: NotificationTemplate[];
      template?: NotificationTemplate;
    },
    private service: RestaurantService,
    private snackBar: MatSnackBar,
    public dialog: MatDialog
  ) {
    this.user = data.user;
    this.users = data.users;
    this.type = data.type;
    this.restaurantId = data.restaurantId || 0;
    this.templates = data.templates || [];
  }

  ngOnInit(): void {
    // If editing a template, pre-fill the fields
    if (this.data.template) {
      this.selectedTemplate = this.data.template;
      this.title = this.data.template.notificationTitle;
      this.body = this.data.template.notificationBody;
    }
  }
//type: 'details' | 'notification' | 'bulk-notification' | 'edit-template'| 'save-template';
  
  mode:string=''
  // Handle template selection from dropdown
  onTemplateSelected(template: NotificationTemplate | null): void {
    if (template) {
      this.selectedTemplate = template;
      this.title = template.notificationTitle;
      this.body = template.notificationBody;
      if (!this.mode || this.mode === 'edit-template') {
        this.mode = this.type;
      }
      this.type = 'edit-template';
    }
    else
    {
      this.selectedTemplate = null;
      this.title = '';
      this.body = '';

      if(this.type === 'edit-template')
      {
        if (this.mode && this.mode !== 'edit-template') {
          this.type = this.mode as any;
        } else {
          this.type = this.users ? 'bulk-notification' : 'notification';
        }
        this.mode = '';
      }
    }

  }

  // Save template only (standalone button)
  saveTemplateOnly(): void {
    if (!this.title.trim() || !this.body.trim()) {
      this.snackBar.open('Please enter both title and body', 'Close', {
        duration: 3000,
        panelClass: 'error-snackbar'
      });
      return;
    }

    // Open Save Template Dialog
    const dialogRef = this.dialog.open(SaveTemplateDialogComponent, {
      width: '400px',
      data: { existingName: this.selectedTemplate?.templateName || '' },
      disableClose: false
    });

    dialogRef.afterClosed().subscribe(templateName => {
      if (templateName) {
        this.createNewTemplate(templateName);
      }
    });
  }

  // Create new template (called from saveTemplateOnly)
  private createNewTemplate(templateName: string): void {
    this.isLoading = true;

    const newTemplate: NotificationTemplate = {
      templateID: 0,
      restaurantId: this.restaurantId,
      templateName,
      notificationTitle: this.title,
      notificationBody: this.body,
      createdOn: new Date().toISOString(),
      createdBy: 'Current User'
    };

    this.service.saveNotificationTemplate(0,this.restaurantId,this.title,this.body,templateName).subscribe(
      (response) => {
        this.snackBar.open(`Template "${templateName}" saved successfully`, 'Close', {
          duration: 3000,
          panelClass: 'success-snackbar'
        });
        this.isLoading = false;
        // Refresh templates dropdown so new record appears immediately
        this.service.getNotificationTemplates(this.restaurantId).subscribe((templates) => {
          this.templates = templates;
        });
      },
      (error) => {
        console.error('Error saving template:', error);
        this.snackBar.open('Failed to save template', 'Close', {
          duration: 3000,
          panelClass: 'error-snackbar'
        });
        this.isLoading = false;
      }
    );
  }

  // Send notification (with optional template saving)
  submit(): void {
    if (!this.title.trim() || !this.body.trim()) {
      this.snackBar.open('Please enter both title and body', 'Close', {
        duration: 3000,
        panelClass: 'error-snackbar'
      });
      return;
    }

    // If "Save as Template" checkbox is checked
    if (this.saveAsTemplate) {
      // Open Save Template Dialog
      const dialogRef = this.dialog.open(SaveTemplateDialogComponent, {
        width: '400px',
        data: { existingName: this.selectedTemplate?.templateName || '' },
        disableClose: false
      });

      dialogRef.afterClosed().subscribe(templateName => {
        if (templateName) {
          // Save template first, then send notification
          this.saveTemplateAndSendNotification(templateName);
        }
      });
    } else {
      // Just send notification without saving template
      this.dialogRef.close({
        title: this.title,
        body: this.body
      });
    }
  }

  // Save template and send notification
  private saveTemplateAndSendNotification(templateName: string): void {
    this.isLoading = true;

    const newTemplate: NotificationTemplate = {
      templateID: 0,
      restaurantId: this.restaurantId,
      templateName,
      notificationTitle: this.title,
      notificationBody: this.body,
      createdOn: new Date().toISOString(),
      createdBy: 'Current User'
    };

    this.service.saveNotificationTemplate(0,this.restaurantId,this.title,this.body,templateName).subscribe(
      (response) => {
        this.snackBar.open(`Template "${templateName}" saved successfully`, 'Close', {
          duration: 3000,
          panelClass: 'success-snackbar'
        });
        this.isLoading = false;

        // Now close dialog and trigger notification send
        this.dialogRef.close({
          title: this.title,
          body: this.body
        });
      },
      (error) => {
        console.error('Error saving template:', error);
        this.snackBar.open('Failed to save template', 'Close', {
          duration: 3000,
          panelClass: 'error-snackbar'
        });
        this.isLoading = false;
      }
    );
  }

  
  DeleteTemplate(): void {
    
    if (!this.selectedTemplate) {
      this.snackBar.open('No template selected', 'Close', {
        duration: 3000,
        panelClass: 'error-snackbar'
      });
      return;
    }

    this.isLoading = true;

    const updatedTemplate: NotificationTemplate = {
      ...this.selectedTemplate,
      notificationTitle: this.title,
      notificationBody: this.body
    };

    this.service.deleteNotificationTemplate(this.selectedTemplate.templateID).subscribe(
      (response) => {
        this.snackBar.open('Template Delete successfully', 'Close', {
          duration: 3000,
          panelClass: 'success-snackbar'
        });
        this.isLoading = false;
              // Refresh templates dropdown so new record appears immediately
        this.service.getNotificationTemplates(this.restaurantId).subscribe((templates) => {
          this.templates = templates;
        });
      this.selectedTemplate = null;
      this.title = '';
      this.body = '';

        // Reset type back to original mode
        if (this.mode && this.mode !== 'edit-template') {
          this.type = this.mode as any;
        } else {
          this.type = this.users ? 'bulk-notification' : 'notification';
        }
        this.mode = '';
      },
      (error) => {
        console.error('Error updating template:', error);
        this.snackBar.open('Failed to update template', 'Close', {
          duration: 3000,
          panelClass: 'error-snackbar'
        });
        this.isLoading = false;
      }
    );
  }
  // Update existing template (for edit-template type)
  updateTemplate(): void {
    
    if (!this.selectedTemplate) {
      this.snackBar.open('No template selected', 'Close', {
        duration: 3000,
        panelClass: 'error-snackbar'
      });
      return;
    }

    this.isLoading = true;

    const updatedTemplate: NotificationTemplate = {
      ...this.selectedTemplate,
      notificationTitle: this.title,
      notificationBody: this.body
    };

    this.service.saveNotificationTemplate(this.selectedTemplate.templateID,this.restaurantId,this.title,this.body,this.selectedTemplate.templateName).subscribe(
      (response) => {
        this.snackBar.open('Template updated successfully', 'Close', {
          duration: 3000,
          panelClass: 'success-snackbar'
        });
        this.isLoading = false;
       // this.dialogRef.close({ updated: true });
      },
      (error) => {
        console.error('Error updating template:', error);
        this.snackBar.open('Failed to update template', 'Close', {
          duration: 3000,
          panelClass: 'error-snackbar'
        });
        this.isLoading = false;
      }
    );
  }

  // Save as a new template using the same name with modified title/body
  saveAsNewTemplate(): void {
    if (!this.title.trim() || !this.body.trim()) {
      this.snackBar.open('Please enter both title and body', 'Close', {
        duration: 3000,
        panelClass: 'error-snackbar'
      });
      return;
    }

    const templateName = this.selectedTemplate?.templateName || 'New Template';
    this.isLoading = true;

    this.service.saveNotificationTemplate(0, this.restaurantId, this.title, this.body, templateName).subscribe(
      (response) => {
        this.snackBar.open(`New template "${templateName}" saved successfully`, 'Close', {
          duration: 3000,
          panelClass: 'success-snackbar'
        });
        this.isLoading = false;
        // Refresh templates dropdown
        this.service.getNotificationTemplates(this.restaurantId).subscribe((templates) => {
          this.templates = templates;
        });
      },
      (error) => {
        console.error('Error saving new template:', error);
        this.snackBar.open('Failed to save new template', 'Close', {
          duration: 3000,
          panelClass: 'error-snackbar'
        });
        this.isLoading = false;
      }
    );
  }

  close(): void {
    this.dialogRef.close();
  }

  // Helper method to get dialog title
  getDialogTitle(): string {
    if (this.type === 'details') {
      return 'User Details';
    } else if (this.type === 'edit-template') {
      return 'Edit Template';
    } else if (this.type === 'notification') {
      return 'Send Notification to ' + (this.user?.firstName || 'Member');
    } else if (this.type === 'bulk-notification') {
      return `Send Notification to ${this.users?.length || 0} Members`;
    }
    return 'Notification';
  }
}