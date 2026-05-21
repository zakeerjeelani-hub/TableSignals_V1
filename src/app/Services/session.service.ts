import { Inject, Injectable, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

@Injectable({
  providedIn: 'root'
})
export class SessionService {
  private readonly isBrowser: boolean;

  constructor(@Inject(PLATFORM_ID) platformId: Object) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  getItem(key: string): string | null {
    if (!this.isBrowser) return null;
    try {
      const item = localStorage.getItem(key);
      if (item !== null) return item;
    } catch (e) {
      // localStorage might fail in incognito
    }
    // Fallback to sessionStorage
    try {
      return sessionStorage.getItem(key);
    } catch (e) {
      return null;
    }
  }

  setItem(key: string, value: string): void {
    if (!this.isBrowser) return;
    try {
      localStorage.setItem(key, value);
    } catch (e) {
      // Incognito mode or quota exceeded - silently handle
      console.warn('localStorage.setItem failed (incognito?)', key, e);
    }
  }

  removeItem(key: string): void {
    if (!this.isBrowser) return;
    localStorage.removeItem(key);
  }

  getSessionItem(key: string): string | null {
    if (!this.isBrowser) return null;
    return sessionStorage.getItem(key);
  }

  setSessionItem(key: string, value: string): void {
    if (!this.isBrowser) return;
    sessionStorage.setItem(key, value);
  }

  removeSessionItem(key: string): void {
    if (!this.isBrowser) return;
    sessionStorage.removeItem(key);
  }

  getNumber(key: string, fallback = 0): number {
    const raw = this.getItem(key);
    if (raw === null || raw === '') return fallback;
    const parsed = parseInt(raw, 10);
    return Number.isNaN(parsed) ? fallback : parsed;
  }

  clearLocal(): void {
    if (!this.isBrowser) return;
    localStorage.clear();
  }

  clearSession(): void {
    if (!this.isBrowser) return;
    sessionStorage.clear();
  }

  clearAll(): void {
    this.clearLocal();
    this.clearSession();
  }
}
