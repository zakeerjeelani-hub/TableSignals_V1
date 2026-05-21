import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class QrSessionManagerService {
  private sessionData = new BehaviorSubject<any>({
    isValid: false,
    sessionStartTime: 0,
    lastActivityTime: 0
  });

  private CHECK_INTERVAL = 5000; // Check every 5 seconds
  private SESSION_TIMEOUT = 15 * 60 * 1000; // 15 minutes of inactivity
  private MAX_SESSION_DURATION = 30 * 60 * 1000; // 30 minutes total
  
  private activityCheckTimer: any = null;
  private activityTimeoutTimer: any = null;
  private boundActivityHandler: any;

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {
    // Bind the activity handler to preserve 'this' context
    this.boundActivityHandler = this.handleActivity.bind(this);
  }

  initSession(params: any): void {
    if (!isPlatformBrowser(this.platformId)) return;

    //console.log('initSession called with params:', params); // DEBUG

    // Clear any existing session
    this.clearSession();

    // Verify required parameters
    if (!params || !params['restaurantid'] || !params['tableid']) {
      //console.error('Invalid params for initSession:', params); // DEBUG
      this.sessionData.next({
        isValid: false,
        sessionStartTime: 0,
        lastActivityTime: 0
      });
      return;
    }

    const now = Date.now();

    // console.log('Session initialized with:', {
    //   restaurantId: params['restaurantid'],
    //   tableid: params['tableid'],
    //   startTime: new Date(now).toLocaleTimeString()
    // }); // DEBUG

    // Initialize session data
    this.sessionData.next({
      isValid: true,
      restaurantId: params['restaurantid'],
      tableid: params['tableid'],
      restaurantName: params['restaurantname'],
      keyword: params['keyword'],
      qrType: params['qrType'],
      sessionStartTime: now,
      lastActivityTime: now
    });

    // Start monitoring
    this.startMonitoring();
  }

  /**
   * Get session data as observable
   */
  getSessionData(): Observable<any> {
    return this.sessionData.asObservable();
  }

  /**
   * Get current session data value
   */
  getSessionDataValue(): any {
    return this.sessionData.value;
  }

  /**
   * Get remaining time in milliseconds
   */
  getSessionRemainingTime(): number {
    const sessionData = this.sessionData.value;
    if (!sessionData || !sessionData.isValid) {
      return 0;
    }

    const now = Date.now();
    const inactivityDuration = now - sessionData.lastActivityTime;
    const remainingTime = this.SESSION_TIMEOUT - inactivityDuration;

    return Math.max(0, remainingTime);
  }

  /**
   * Update activity timestamp
   */
  updateActivity(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    const currentSessionData = this.sessionData.value;
    if (!currentSessionData || !currentSessionData.isValid) {
      return;
    }

   // console.log('Activity updated at:', new Date().toLocaleTimeString()); // DEBUG

    // Update last activity time
    this.sessionData.next({
      ...currentSessionData,
      lastActivityTime: Date.now()
    });

    // Clear and reset activity timeout
    this.resetActivityTimeout();
  }

  /**
   * Handle activity events
   */
  private handleActivity = (): void => {
    this.updateActivity();
  };

  /**
   * Check session activity and validity
   */
  private checkActivity(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    const currentSessionData = this.sessionData.value;

    if (!currentSessionData || !currentSessionData.isValid) {
      this.clearSession();
      return;
    }

    const now = Date.now();
    const sessionDuration = now - currentSessionData.sessionStartTime;
    const inactivityDuration = now - currentSessionData.lastActivityTime;

    // console.log('Session check:', {
    //   sessionDuration: Math.round(sessionDuration / 1000) + 's',
    //   inactivityDuration: Math.round(inactivityDuration / 1000) + 's',
    //   maxInactivity: Math.round(this.SESSION_TIMEOUT / 1000) + 's',
    //   maxDuration: Math.round(this.MAX_SESSION_DURATION / 1000) + 's'
    // }); // DEBUG

    // Check if session has exceeded max duration
    if (sessionDuration > this.MAX_SESSION_DURATION) {
      //console.warn('Session expired: Max duration exceeded');
      this.clearSession();
      return;
    }

    // Check if inactive for too long
    if (inactivityDuration > this.SESSION_TIMEOUT) {
      //console.warn('Session expired: Inactivity timeout');
      this.clearSession();
      return;
    }
  }

  /**
   * Reset activity timeout
   */
  private resetActivityTimeout(): void {
    if (this.activityTimeoutTimer) {
      clearTimeout(this.activityTimeoutTimer);
    }

    // Set a timeout to expire session if no activity
    this.activityTimeoutTimer = setTimeout(() => {
      //console.warn('Activity timeout - no user interaction');
      this.clearSession();
    }, this.SESSION_TIMEOUT);
  }

  /**
   * Start monitoring session
   */
  private startMonitoring(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    //console.log('Session monitoring started'); // DEBUG

    // Set up event listeners for user activity
    const activityEvents = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];

    activityEvents.forEach(eventName => {
      window.addEventListener(eventName, this.boundActivityHandler, true);
    });

    // Start the activity check timer
    this.activityCheckTimer = setInterval(() => {
      this.checkActivity();
    }, this.CHECK_INTERVAL);

    // Reset activity timeout
    this.resetActivityTimeout();
  }

  /**
   * Clear session
   */
  clearSession(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    //console.log('Session cleared'); // DEBUG

    // Remove event listeners
    const activityEvents = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    activityEvents.forEach(eventName => {
      window.removeEventListener(eventName, this.boundActivityHandler, true);
    });

    // Clear timers
    if (this.activityCheckTimer) {
      clearInterval(this.activityCheckTimer);
      this.activityCheckTimer = null;
    }

    if (this.activityTimeoutTimer) {
      clearTimeout(this.activityTimeoutTimer);
      this.activityTimeoutTimer = null;
    }

    // Invalidate session
    this.sessionData.next({
      isValid: false,
      sessionStartTime: 0,
      lastActivityTime: 0
    });
  }

  /**
   * Destroy service
   */
  ngOnDestroy(): void {
    this.clearSession();
  }
}