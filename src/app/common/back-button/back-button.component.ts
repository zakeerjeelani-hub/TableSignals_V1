import { Component, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser, CommonModule } from '@angular/common';
import { Router, NavigationEnd } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { filter } from 'rxjs/operators';
import { SessionService } from '../../Services/session.service';

// Standalone confirmation dialog component 
@Component({
  selector: 'logout-confirmation-dialog',
  standalone: true,
  imports: [MatDialogModule, MatButtonModule],
  template: `
    <h2 mat-dialog-title>Sign Out</h2>
    <mat-dialog-content>
      Do you want to sign out?
    </mat-dialog-content>
    <mat-dialog-actions>
      <button mat-button [mat-dialog-close]="false">No</button>
      <button mat-button [mat-dialog-close]="true" color="primary">Yes</button>
    </mat-dialog-actions>
  `,
})
export class LogoutConfirmationDialog {}

@Component({
  selector: 'app-back-button',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatButtonModule, MatDialogModule],
  templateUrl: './back-button.component.html',
  styleUrl: './back-button.component.scss'
})
export class BackButtonComponent {
  private isBrowser: boolean;
  private readonly LOGIN_PATHS = ['/login', '/signin', '/auth']; // Update with your login paths
  
  constructor(
    private router: Router,
    private dialog: MatDialog,
    private session: SessionService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(this.platformId);
    
    // Store current URL in session storage when navigating.
    if (this.isBrowser) {
      this.router.events.pipe(
        filter(event => event instanceof NavigationEnd)
      ).subscribe((event: any) => {
        const currentUrl = event.urlAfterRedirects;
        const previousUrl = this.session.getSessionItem('currentUrl');
        
        if (previousUrl) {
          this.session.setSessionItem('previousUrl', previousUrl);
        }
        
        this.session.setSessionItem('currentUrl', currentUrl);
      });
    }
  }

  goBack(): void {
    if (!this.isBrowser) {
      this.router.navigate(['/']);
      return;
    }
    
    // Check if back would take us to a login page
    if (this.isPreviousPageLogin()) {
      this.showLogoutConfirmation();
    } else {
      // Standard back navigation
      if (window.history.length > 1) {
        window.history.back();
      } else {
        // Fallback to home page if no history
        this.router.navigate(['/']);
      }
    }
  }

  // Check if previous page is a login page
  private isPreviousPageLogin(): boolean {
    if (!this.isBrowser) return false;
    
    // First try to get from session storage.
    const previousUrl = this.session.getSessionItem('previousUrl');
    if (previousUrl) {
      return this.isLoginPage(previousUrl);
    }
    
    // Fallback to document.referrer
    const referrer = document.referrer;
    if (referrer) {
      return this.LOGIN_PATHS.some(loginPath => referrer.includes(loginPath));
    }
    
    return false;
  }
  
  private isLoginPage(url: string): boolean {
    return this.LOGIN_PATHS.some(loginPath => url.includes(loginPath));
  }

  private showLogoutConfirmation(): void {
    if (!this.isBrowser) return;
    
    const dialogRef = this.dialog.open(LogoutConfirmationDialog, {
      width: '300px'
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result === true) {
        this.logout();
      }
    });
  }

  private logout(): void {
    if (!this.isBrowser) return;
    
    // Clear storage
    this.session.clearAll();
    
    // Navigate to login
    this.router.navigate([this.LOGIN_PATHS[0]]);
  }
}