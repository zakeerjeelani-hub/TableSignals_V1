// auth.interceptor.ts
import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { SessionService } from '../Services/session.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const session = inject(SessionService);

  const tokenKeys = ['authToken', 'token', 'accessToken', 'jwtToken'];
  const token = tokenKeys
    .map((key) => session.getItem(key))
    .find((value) => !!value);

  const shouldAttachToken = !!token && req.url.includes('/api/v2/Service');
  const authReq = shouldAttachToken
    ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
    : req;

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401) {
        router.navigate(['/login']);
      }
      return throwError(() => error);
    })
  );
};