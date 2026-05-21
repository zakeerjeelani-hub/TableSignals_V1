# TSWeb agent guidance

## Architecture
- This is an Angular 18 standalone-component app with SSR enabled. Entry points live in `src/main.ts`, `src/main.server.ts`, `src/app/app.config.ts`, and `server.ts`.
- Routing is defined in `src/app/app.routes.ts` using `loadComponent`. Public routes include login/signup/open flows; dashboard/setup/profile/QR flows are guarded by `authGuard`.
- `src/app/app.component.ts` owns the shell layout. It hides `TopMenu` and `LeftMenu` on public routes and wraps authenticated pages in the shared desktop/mobile layout from `src/app/app.component.scss`.
- Most business logic flows through `src/app/Services/restaurant.service.ts`. Components call backend endpoints directly through this service rather than via feature-specific state stores.

## Backend and data flow
- The API base URL comes from `src/environments/environment*.ts` and currently points to `https://api.tablesignals.com/api/Service`. Keep backend method names and query parameter casing exactly as the API expects (examples: `RestaurantID`, `UserId`, `TSRestaurantDashboard_V2`).
- Session/auth state is stored in `localStorage` (`restaurantId`, `restaurantName`, `userId`, `roleID`, `isAdmin`) and read across many features such as `dashboard`, `manage-qr`, `left-menu`, and `top-menu`.
- Because SSR is on, browser-only APIs must be guarded with `isPlatformBrowser(...)` or equivalent. Follow patterns in `src/app/guards/auth.guard.ts` and `src/app/restaurant/dashboard/dashboard.component.ts`.
- `src/app/interceptors/auth.interceptor.ts` exists, but `src/app/app.config.ts` currently calls `provideHttpClient()` without `withInterceptors(...)`. Do not assume the interceptor is active unless you wire it up explicitly.

## Project structure
- `src/app/restaurant/*` contains most authenticated restaurant/admin flows: dashboard, area/table setup, QR management, users, profile, upload menu, and onboarding.
- `src/app/common/*` contains reusable UI such as success/error/popup/back-button components.
- `src/app/layout/*` contains the shell navigation components. Menu items are loaded from the backend and mapped to routes in `src/app/layout/left-menu/left-menu.component.ts`.
- `src/app/userapp/*` contains guest/end-user flows such as QR request screens and translation/gallery features.

## Conventions to preserve
- Prefer standalone components and local `imports` arrays; this codebase does not rely on feature NgModules for new UI work.
- Match existing file style: SCSS, `styleUrl`/`templateUrl`, and direct Angular Material imports inside each standalone component.
- Preserve the current service naming style even if it is inconsistent with typical TypeScript conventions (`RestaurantLogin`, `TSAreaSetup`, `GetRestaurantProfile`, etc.). These names mirror backend contracts and existing call sites.
- Many components use `ChangeDetectionStrategy.OnPush` only selectively. Do not add it casually unless you also handle `markForCheck()` and async updates correctly.
- Existing code often uses `any` for API payloads. Improve typing when touching a flow, but avoid broad refactors unless the task requires them.
- Some flows intentionally call `location.reload()` after navigation (for example login/admin login). Treat that as current behavior, not an accident, unless you are explicitly fixing navigation state handling.

## Assets and styling
- Runtime assets come from `public/**` per `angular.json`. When adding images/fonts/icons for the app, prefer `public/assets/...`.
- `src/assets/**` still exists and is included in test config, so be careful not to assume both asset roots behave the same in production.
- Global layout/sticky dialog behavior is in `src/styles.scss`; component SCSS sometimes compensates for layout constraints from global wrappers (see `src/app/restaurant/manage-qr/manage-qr.component.scss` and its `:host` rule).

## Useful commands
- Dev server: `npm start`
- Unit tests: `npm test`
- Production build: `npm run build`
- SSR server after build: `npm run serve:ssr:TSWeb`

## Practical examples
- If you add a protected page, register it in `src/app/app.routes.ts` with `canActivate: [authGuard]` and decide whether it should appear in the backend-driven left menu mapping.
- If you add a new API call, prefer adding it to `RestaurantService` first, then keep component code focused on UI state, subscriptions, and `localStorage`-derived restaurant context.
- If you touch a component that reads `localStorage`, verify SSR safety before moving that logic into constructors or top-level field initializers.