import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
  // Public routes
  { path: '', loadComponent: () => import('./restaurant/login/login.component').then(m => m.LoginComponent) },
  { path: 'login', loadComponent: () => import('./restaurant/login/login.component').then(m => m.LoginComponent) },
  { path: 'signup', loadComponent: () => import('./restaurant/signup/signup.component').then(m => m.SignupComponent) },
  { path: 'forgotpassword', loadComponent: () => import('./restaurant/forgot-password/forgot-password.component').then(m => m.ForgotPasswordComponent) },
  { path: 'ilogin', loadComponent: () => import('./restaurant/i-login/i-login.component').then(m => m.ILoginComponent) },
  { path: 'register', loadComponent: () => import('./restaurant/register/register.component').then(m => m.RegisterComponent) },
  { path: 'verifyEmail', loadComponent: () => import('./signup/verify-email/verify-email.component').then(m => m.VerifyEmailComponent) },
  { path: 'open', loadComponent: () => import('./restaurant/open/open.component').then(m => m.OpenComponent) },
  { path: 'open2', loadComponent: () => import('./userapp/user-request/user-request.component').then(m => m.UserRequestComponent) },
  { path: 'open1', loadComponent: () => import('./userapp/user-request1/user-request1.component').then(m => m.UserRequest1Component) },
  { path: 'showmenu', loadComponent: () => import('./restaurant/showmenu/showmenu.component').then(m => m.ShowmenuComponent) },
  { path: 'googleap', loadComponent: () => import('./userapp/google-translate/google-translate.component').then(m => m.GoogleTranslateComponent) },
  { path: 'adsense', loadComponent: () => import('./common/adsense/adsense.component').then(m => m.AdsenseComponent) },
  { path: 'custommessage', loadComponent: () => import('./userapp/custom-message/custom-message.component').then(m => m.CustomMessageComponent) },

  // Protected routes
  { path: 'dashboard', loadComponent: () => import('./restaurant/dashboard/dashboard.component').then(m => m.DashboardComponent), canActivate: [authGuard] },
  { path: 'setup', loadComponent: () => import('./restaurant/restaurantsetup/restaurantsetup.component').then(m => m.RestaurantsetupComponent), canActivate: [authGuard] },
  { path: 'areas', loadComponent: () => import('./restaurant/areas/areas.component').then(m => m.AreasComponent), canActivate: [authGuard] },
  { path: 'areatables', loadComponent: () => import('./restaurant/areatables/areatables.component').then(m => m.AreatablesComponent), canActivate: [authGuard] },
  { path: 'qrgenerator', loadComponent: () => import('./restaurant/qr-code-generator/qr-code-generator.component').then(m => m.QrCodeGeneratorComponent), canActivate: [authGuard] },
  { path: 'profile', loadComponent: () => import('./restaurant/profile/profile.component').then(m => m.ProfileComponent), canActivate: [authGuard] },
  { path: 'uploadmenu', loadComponent: () => import('./restaurant/uploadmenu/uploadmenu.component').then(m => m.UploadmenuComponent), canActivate: [authGuard] },
  { path: 'restaurantlist', loadComponent: () => import('./restaurant/restaurant-list/restaurant-list.component').then(m => m.RestaurantListComponent), canActivate: [authGuard] },
  { path: 'myAppQR', loadComponent: () => import('./restaurant/QRGenerator/qrgenerator.component').then(m => m.QRGeneratorComponent), canActivate: [authGuard] },
  { path: 'restaurantusers', loadComponent: () => import('./restaurant/restaurant-user-grid/restaurant-user-grid.component').then(m => m.RestaurantUserGridComponent), canActivate: [authGuard] },
  { path: 'RestaurantMembershipusers', loadComponent: () => import('./restaurant/restaurant-membershipusers/restaurant-membershipusers.component').then(m => m.RestaurantMembershipusersComponent), canActivate: [authGuard] },
  { path: 'RestaurantQuickSetup', loadComponent: () => import('./restaurant/restaurant-setup-wizard/restaurant-setup-wizard.component').then(m => m.RestaurantSetupWizardComponent), canActivate: [authGuard] },
  { path: 'area1', loadComponent: () => import('./restaurant/areatables1/areatables1.component').then(m => m.Areatables1Component), canActivate: [authGuard] },
  { path: 'ManageQR', loadComponent: () => import('./restaurant/manage-qr/manage-qr.component').then(m => m.ManageQRComponent), canActivate: [authGuard] },
];
