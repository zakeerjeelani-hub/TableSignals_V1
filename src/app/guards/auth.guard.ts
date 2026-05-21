import { inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { CanActivateFn, Router } from '@angular/router';
import { SessionService } from '../Services/session.service';

export const authGuard: CanActivateFn = () => {
  const router = inject(Router);
  const platformId = inject(PLATFORM_ID);
  const session = inject(SessionService);

  if (!isPlatformBrowser(platformId)) {
    return true; // Allow SSR to pass through; auth checked on client
  }

  // Check both localStorage and sessionStorage for auth info
  const restaurantId = session.getNumber('restaurantId', 0) || session.getNumber('sessionRestaurantId', 0);
  const isAdmin = session.getItem('isAdmin') || session.getSessionItem('sessionAdmin');
  const authToken = session.getItem('authToken') || session.getSessionItem('sessionAuthToken');

  // Allow if we have any auth indicator (restaurantId, isAdmin, or authToken)
  if (restaurantId > 0 || isAdmin === 'Admin' || authToken) {
    return true;
  }

  router.navigate(['/login']);
  return false;
};
