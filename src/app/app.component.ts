import { Component } from '@angular/core';
import { NavigationEnd, NavigationStart, Router, RouterOutlet } from '@angular/router';
import { TopMenuComponent } from './layout/top-menu/top-menu.component';
import { LeftMenuComponent } from './layout/left-menu/left-menu.component';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, TopMenuComponent, LeftMenuComponent, CommonModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  title = 'TSWeb';
  showMenus = false;

  private readonly publicRoutes = [
    '/',
    '/login',
    '/signup',
    '/open',
    '/open1',
    '/open2',
    '/forgotpassword',
    '/register',
    '/verifyEmail',
    '/ilogin',
    '/showmenu',
    '/googleap',
    '/adsense'
  ];

  constructor(private router: Router) {
    this.updateMenuVisibility(this.router.url);

    this.router.events.subscribe((event) => {
      if (event instanceof NavigationStart || event instanceof NavigationEnd) {
        this.updateMenuVisibility(this.router.url);
      }
    });
  }

  private updateMenuVisibility(url: string): void {
    const currentUrl = (url || '').split('?')[0] || '/';
    this.showMenus = !this.isPublicRoute(currentUrl);
  }

  private isPublicRoute(url: string): boolean {
    return this.publicRoutes.some(route => route === '/'
      ? url === '/'
      : url === route || url.startsWith(`${route}/`));
  }
}
