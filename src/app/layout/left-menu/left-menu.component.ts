import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Component, Inject, OnInit, PLATFORM_ID } from '@angular/core';
import { Router } from '@angular/router';
import { RestaurantService } from '../../Services/restaurant.service';
import { MenuItem } from '../../models/restaurant-request.model';
import { SessionService } from '../../Services/session.service';

@Component({
  selector: 'app-left-menu',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './left-menu.component.html',
  styleUrl: './left-menu.component.scss'
})
export class LeftMenuComponent implements OnInit {
  enableService: boolean = true;
  isUser: boolean = true;
  menuItems: MenuItem[] = [];
  isMobileMenuOpen: boolean = false;

  // Route mapping based on menu titles
  private routeMap: { [key: string]: string } = {
    'Dashboard': '/dashboard',
    'Area Setup': '/areas',
    'Table Setup': '/area1',
    'Print QR Code': '/ManageQR',
    'Profile': '/profile',
    'Upload Menu': '/uploadmenu',
    'User Management': '/restaurantusers',
    'VIPs': '/RestaurantMembershipusers'
  };

  constructor(
    private router: Router,
    private service: RestaurantService,
    private session: SessionService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    if (isPlatformBrowser(this.platformId)) {
      if (this.session.getItem('isAdmin') === 'Admin') {
        this.isUser = false;
      }
    }
  }

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.loadMenuItems();
      this.loadNotificationStatus();
    }
  }

  /**
   * Load notification status from API
   */
  private loadNotificationStatus(): void {
    const restaurantId = this.session.getNumber('restaurantId', 0);

    this.service.TSGetEnableDisableUsersService(restaurantId, 0).subscribe(
      response => {
        this.enableService = response.isServiceEnabled;
      },
      error => {
        console.error('Push Notification Status API Error', error);
      }
    );
  }

  /**
   * Load menu items from API
   */
  loadMenuItems(): void {
    const roleId = this.session.getNumber('roleID', 0);

    this.service.TSGetMenu(roleId).subscribe(
      (response: MenuItem[]) => {
        this.menuItems = this.buildMenuTree(response);
      },
      error => {
        console.error('Menu API Error', error);
      }
    );
  }

  /**
   * Build hierarchical menu tree from flat array
   */
  private buildMenuTree(items: MenuItem[]): MenuItem[] {
    const map = new Map<number, MenuItem>();
    const roots: MenuItem[] = [];

    // Initialize all items with children array and visibility flag
    items.forEach(item => {
      map.set(item.menuId, {
        ...item,
        children: [],
        isSubmenuVisible: false
      });
    });

    // Build the tree structure
    items.forEach(item => {
      const node = map.get(item.menuId)!;
      if (item.parentMenuId === 0) {
        roots.push(node);
      } else {
        const parent = map.get(item.parentMenuId);
        if (parent) {
          parent.children!.push(node);
        }
      }
    });

    return roots;
  }

  /**
   * Toggle submenu visibility
   */
  toggleSubmenu(menuItem: MenuItem): void {
    menuItem.isSubmenuVisible = !menuItem.isSubmenuVisible;
  }

  /**
   * Check if menu item has children
   */
  hasChildren(menuItem: MenuItem): boolean {
    return menuItem.children !== undefined && menuItem.children.length > 0;
  }

  /**
   * Navigate to route based on menu item
   */
  navigateToRoute(menuItem: MenuItem): void {
    const route = this.routeMap[menuItem.menuTitle];
    if (route) {
      this.router.navigate([route]);
      this.closeMobileMenu(); // Close menu after navigation on mobile
    } else {
      console.warn(`No route mapped for menu: ${menuItem.menuTitle}`);
    }
  }

  /**
   * Handle menu item click - either expand submenu or navigate
   */
  onMenuClick(menuItem: MenuItem): void {
    if (this.hasChildren(menuItem)) {
      this.toggleSubmenu(menuItem);
    } else {
      this.navigateToRoute(menuItem);
    }
  }

  /**
   * Toggle mobile menu visibility
   */
  toggleMobileMenu(): void {
    this.isMobileMenuOpen = !this.isMobileMenuOpen;
  }

  /**
   * Close mobile menu
   */
  closeMobileMenu(): void {
    this.isMobileMenuOpen = false;
  }

  /**
   * Enable/Disable push notification service
   */
  enableDisableService(): void {
    const newState = !this.enableService;
    const restaurantId = this.session.getNumber('restaurantId', 0);

    this.service.TSEnableDisableUsersService(restaurantId, 0, newState).subscribe(
      response => {
        this.enableService = newState;
        const message = newState
          ? 'Push Notifications Service is Enabled for the User'
          : 'Push Notifications Service is Disabled for the User';
        alert(message);
      },
      error => {
        console.error('Failed to toggle notification service', error);
        // Revert state on error
        this.enableService = !newState;
      }
    );
  }
}