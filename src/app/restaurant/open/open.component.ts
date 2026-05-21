import { CommonModule } from '@angular/common';
import { Router, RouterOutlet, ActivatedRoute } from '@angular/router';
import { Component, Inject, OnInit, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import {
  MembershipEligibilityCheckRequest,
  MembershipSignUpRequest,
  RestaurantService
} from '../../Services/restaurant.service';
import { Clipboard } from '@angular/cdk/clipboard';
import { MatIcon } from '@angular/material/icon';

@Component({
  selector: 'app-open',
  standalone: true,
  imports: [CommonModule, FormsModule, MatProgressSpinnerModule,MatIcon],
  templateUrl: './open.component.html',
  styleUrls: ['./open.component.scss']
})
export class OpenComponent implements OnInit {
  isAndroid = false;
  isIOS = false;
  isDeviceDetected = false;
  androidAppLink = 'https://play.google.com/store/apps/details?id=com.rattletech.TableSignalApp&hl=en_IN&pli=1';
  iosAppLink = 'https://apps.apple.com/in/app/table-signals/id6462874524';
  tableid: any;
  restaurantid: any;
  restaurantname: any;
  qrId: any = 0;
  qrType: any = 0;
  showVipPopup = false;
  vipFirstName = '';
  vipLastName = '';
  vipBirthDay = '';
  vipBirthMonth: number | null = null;
  vipMobileNo = '';
  vipEmailID = '';
  vipCity = '';
  vipError = '';
  isVipSubmitting = false;
  isVipChecking = false;
  vipSubmitted = false;
  showVipRegistrationForm = false;
  referralCode = '';
  vipResultType: 'none' | 'same-restaurant-member' | 'existing-user-other-restaurant' | 'new-registration' = 'none';
  vipSuccessTitle = '';
  vipSuccessMessage = '';
  showReferralCode = false;
  
  // Custom Request (qrType 5) Properties
  showCustomRequestPopup = false;
  customDescription = '';
  isLoadingRequest = false;
  requestError = '';
  requestSuccess = false;
  
  // Constants
  readonly QR_TYPE_RESTAURANT = 1;
  readonly QR_TYPE_TABLE = 2;
  readonly QR_TYPE_VIP = 3;
  readonly QR_TYPE_CUSTOM_IMMEDIATE = 4;
  readonly QR_TYPE_CUSTOM_WITH_DESCRIPTION = 5;
  readonly DEVICE_ID = 'abc';
  readonly months = [
    { label: 'January', value: 1 },
    { label: 'February', value: 2 },
    { label: 'March', value: 3 },
    { label: 'April', value: 4 },
    { label: 'May', value: 5 },
    { label: 'June', value: 6 },
    { label: 'July', value: 7 },
    { label: 'August', value: 8 },
    { label: 'September', value: 9 },
    { label: 'October', value: 10 },
    { label: 'November', value: 11 },
    { label: 'December', value: 12 },
  ];

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    public router: Router,
    private route: ActivatedRoute,
    // TODO: Inject your service here
     private requestService: RestaurantService,
     private clipboard: Clipboard
  ) {
    if (isPlatformBrowser(this.platformId)) {
      this.route.queryParams.subscribe((params) => {
        this.applyDirectQueryParams(params);
        this.decodeQRData(params['data']);
      });
    }
  }

  private applyDirectQueryParams(params: any): void {
    if (!params) {
      return;
    }

    if (params['restaurantid']) {
      this.restaurantid = params['restaurantid'];
    }
    if (params['restaurantname']) {
      this.restaurantname = params['restaurantname'];
    }
    if (params['tableid']) {
      this.tableid = params['tableid'];
    }
    if (params['qrId']) {
      this.qrId = params['qrId'];
    }

    const directQrType = params['QRType'] ?? params['qrType'];
    if (directQrType !== undefined && directQrType !== null && directQrType !== '') {
      const parsedQrType = parseInt(String(directQrType), 10);
      if (!Number.isNaN(parsedQrType)) {
        this.qrType = parsedQrType;
      }
    }
  }

  /**
   * Decode QR data from encoded string
   * @param encodedData Base64 encoded QR data
   */
  private decodeQRData(encodedData: string): void {
    try {
      if (!encodedData) {
        this.handleQRError('QR data not found in URL');
        return;
      }

      const decodedData = atob(encodedData);
      const parts = decodedData.split('|');

      // Validate decoded data — minimum 4 parts required
      if (parts.length < 4) {
        this.handleQRError('Invalid QR code format');
        return;
      }

      // Extract values — qrType defaults to QR_TYPE_TABLE (2) if not present
      this.restaurantid = parts[0];
      this.qrId = parts[1];
      this.restaurantname = parts[2];
      this.qrType = parseInt(parts[4] || '2', 10);

      // Log for debugging
      console.log('✅ QR Decoded:', {
        restaurantid: this.restaurantid,
        qrId: this.qrId,
        restaurantname: this.restaurantname,
        qrType: this.qrType
      });
    } catch (error) {
      this.handleQRError('Failed to decode QR code');
      console.error('QR Decode Error:', error);
    }
  }

  /**
   * Handle QR decoding errors
   * @param errorMessage Error message to display
   */
  private handleQRError(errorMessage: string): void {
    console.error('❌ QR Error:', errorMessage);
    // Could show error popup or redirect to error page
  }

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      // Detect device type
      const userAgent = navigator.userAgent || navigator.vendor;
      this.isAndroid = /android/i.test(userAgent);
      this.isIOS = /iPad|iPhone|iPod/.test(userAgent);
      this.isDeviceDetected = true;

      // Handle different QR types
      this.handleQRType();
    }
  }

  /**
   * Handle different QR types
   */
  private handleQRType(): void {
    switch (this.qrType) {
      case this.QR_TYPE_VIP:
        this.showVipPopup = true;
        break;

      case this.QR_TYPE_CUSTOM_IMMEDIATE:
        // Call API immediately with empty description
        this.submitCustomRequest('');
        break;

      case this.QR_TYPE_CUSTOM_WITH_DESCRIPTION:
        // Show popup for user to enter description
        this.showCustomRequestPopup = true;
        break;

      case this.QR_TYPE_TABLE:
        this.tableid=this.qrId;
        break;
      case this.QR_TYPE_RESTAURANT:
      default:
        // Restaurant-wide QR, just display app download options
        break;
    }
  }

  /**
   * Close VIP popup
   */
  closeVipPopup(): void {
    this.showVipPopup = false;
  }

  onVipMobileInput(value: string): void {
    this.vipMobileNo = this.formatUsPhoneNumber(value);
  }

  private getPlainVipMobileNo(): string {
    return String(this.vipMobileNo ?? '').replace(/\D/g, '').slice(0, 10);
  }

  private formatUsPhoneNumber(value: string): string {
    const digits = String(value ?? '').replace(/\D/g, '').slice(0, 10);

    if (!digits) {
      return '';
    }

    if (digits.length <= 3) {
      return `(${digits}`;
    }

    if (digits.length <= 6) {
      return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
    }

    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  }

  private validateVipForm(): boolean {
    this.vipError = '';
    const plainMobileNo = this.getPlainVipMobileNo();

    if (!this.vipFirstName.trim()) {
      this.vipError = 'Please enter first name.';
      return false;
    }
    if (!this.vipLastName.trim()) {
      this.vipError = 'Please enter last name.';
      return false;
    }
    if (!this.vipBirthDay.trim()) {
      this.vipError = 'Please enter birth day.';
      return false;
    }
    const day = parseInt(this.vipBirthDay, 10);
    if (Number.isNaN(day) || day < 1 || day > 31) {
      this.vipError = 'Birth day must be between 1 and 31.';
      return false;
    }
    if (!this.vipBirthMonth) {
      this.vipError = 'Please select birth month.';
      return false;
    }
    if (!plainMobileNo) {
      this.vipError = 'Please enter mobile number.';
      return false;
    }

    if (plainMobileNo.length < 10) {
      this.vipError = 'Please enter a valid mobile number.';
      return false;
    }

    return true;
  }

  private validateVipCheckInputs(): boolean {
    this.vipError = '';

    const mobile = this.getPlainVipMobileNo();
    const email = this.vipEmailID.trim();

    if (!mobile && !email) {
      this.vipError = 'Please enter email or mobile number.';
      return false;
    }

    if (mobile) {
      const digitsOnly = mobile.replace(/\D/g, '');
      if (digitsOnly.length < 10) {
        this.vipError = 'Please enter a valid mobile number.';
        return false;
      }
    }

    if (email && !/^\S+@\S+\.\S+$/.test(email)) {
      this.vipError = 'Please enter a valid email address.';
      return false;
    }

    return true;
  }

copyCode(code: string) {
    this.clipboard.copy(code);
    alert('Verification code copied to clipboard!');
}

  private resolveVipFlow(response: any): {
    resultType: 'same-restaurant-member' | 'existing-user-other-restaurant' | 'new-registration';
    membershipCode: string;
    title: string;
    message: string;
    showCode: boolean;
  } {
    const rawMessage = String(response?.message ?? response?.Message ?? '').trim();
    const message = rawMessage.toLowerCase();
    const membershipCode = String(response?.membershipCode ?? response?.MembershipCode ?? '').trim();
    const restaurantDisplayName = String(this.restaurantname ?? '').trim() || 'this restaurant';

    const sameRestaurantFlag = response?.alreadyVipMemberForRestaurant === true || response?.isAlreadyVIPForRestaurant === true;
    const existingUserFlag = response?.isExistingTableSignalsUser === true || response?.alreadyTableSignalsUser === true;

    if (sameRestaurantFlag || (message.includes('already') && message.includes('vip') && message.includes('restaurant') && !membershipCode)) {
      return {
        resultType: 'same-restaurant-member',
        membershipCode: '',
        title: `You are already a VIP member at ${restaurantDisplayName}`,
        message: `You are already a VIP member at ${restaurantDisplayName}. Please open the app and start sending your request.`,
        showCode: false,
      };
    }

    if (existingUserFlag || (message.includes('already') && message.includes('table signals'))) {
      return {
        resultType: 'existing-user-other-restaurant',
        membershipCode,
        title: 'You are already a Table Signals user',
        message: `You are already a user of Table Signals. Here is your code. Please open the app, enter the code, and become a VIP member for ${restaurantDisplayName}.`,
        showCode: !!membershipCode,
      };
    }

    return {
      resultType: 'new-registration',
      membershipCode,
      title: 'Registration successful',
      message: `Your VIP registration for ${restaurantDisplayName} was completed. Open the app and enter this code to continue.`,
      showCode: !!membershipCode,
    };
  }

  submitVipSignUp(): void {
    if (!this.validateVipForm()) {
      return;
    }

    const payload: MembershipSignUpRequest = {
      firstName: this.vipFirstName.trim(),
      lastName: this.vipLastName.trim(),
      birthDay: this.vipBirthDay.trim(),
      birthMonth: this.vipBirthMonth!,
      mobileNo: this.getPlainVipMobileNo(),
      emailID: this.vipEmailID.trim(),
      city: this.vipCity.trim(),
      restaurantId: parseInt(this.restaurantid, 10) || 0,
    };

    this.isVipSubmitting = true;
    this.vipError = '';
    this.vipResultType = 'none';
    this.vipSuccessTitle = '';
    this.vipSuccessMessage = '';
    this.showReferralCode = false;
    this.referralCode = '';

    this.requestService.membershipSignUp(payload).subscribe({
      next: (response) => {
        const flow = this.resolveVipFlow(response);

        if (flow.showCode && !flow.membershipCode) {
          this.vipError = response?.message || 'Verification code was not returned by the server.';
          this.isVipSubmitting = false;
          return;
        }

        if (flow.showCode) {
          this.clipboard.copy(flow.membershipCode);
        }

        this.vipResultType = flow.resultType;
        this.vipSuccessTitle = flow.title;
        this.vipSuccessMessage = flow.message;
        this.showReferralCode = flow.showCode;
        this.referralCode = flow.membershipCode;
        this.vipSubmitted = true;
        this.isVipSubmitting = false;
        this.showContinueBrowser = false;
      },
      error: (error) => {
        this.isVipSubmitting = false;
        this.vipError = error?.error?.message || 'Unable to complete signup right now. Please try again.';
      }
    });
  }

  checkVipMembership(): void {
    if (!this.validateVipCheckInputs()) {
      return;
    }

    const payload: MembershipEligibilityCheckRequest = {
      restaurantId: parseInt(this.restaurantid, 10) || 0,
      mobileNo: this.getPlainVipMobileNo() || undefined,
      emailID: this.vipEmailID.trim() || undefined,
    };

    this.isVipChecking = true;
    this.vipError = '';
    this.vipSubmitted = false;
    this.vipResultType = 'none';
    this.vipSuccessTitle = '';
    this.vipSuccessMessage = '';
    this.showReferralCode = false;
    this.referralCode = '';

    this.requestService.checkMembershipEligibility(payload).subscribe({
      next: (response) => {
        this.isVipChecking = false;

        const rawMessage = String(response?.message ?? '').toLowerCase();
        const explicitNoRecord = response?.noRecordFound === true || response?.shouldCollectRegistrationDetails === true;
        const inferredNoRecord = rawMessage.includes('no record') || rawMessage.includes('not found') || rawMessage.includes('new user');

        if (explicitNoRecord || inferredNoRecord) {
          // Step 2: show full registration fields only when user is not found.
          this.showVipRegistrationForm = true;
          return;
        }

        const flow = this.resolveVipFlow(response);

        if (flow.showCode && !flow.membershipCode) {
          this.vipError = response?.message || 'Verification code was not returned by the server.';
          return;
        }

        if (flow.showCode) {
          this.clipboard.copy(flow.membershipCode);
        }

        this.vipResultType = flow.resultType;
        this.vipSuccessTitle = flow.title;
        this.vipSuccessMessage = flow.message;
        this.showReferralCode = flow.showCode;
        this.referralCode = flow.membershipCode;
        this.vipSubmitted = true;
        this.showContinueBrowser = false;
      },
      error: (error) => {
        this.isVipChecking = false;
        this.vipError = error?.error?.message || 'Unable to verify membership right now. Please try again.';
      }
    });
  }

  /**
   * Download VIP app
   */
  downloadVipApp(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    if (isIOS) {
      window.open(this.iosAppLink, '_blank');
    } else {
      window.open(this.androidAppLink, '_blank');
    }
    this.closeVipPopup();
  }

  /**
   * Continue in browser - navigate to next page
   */
  continueInBrowser(): void {
    debugger
    this.router.navigate(['/open1'], {
      queryParams: {
        restaurantid: this.restaurantid,
        tableid: this.tableid,
        restaurantname: this.restaurantname,
        qrType: this.qrType
      }
    });
  }

  /**
   * Close custom request popup
   */
  closeCustomRequestPopup(): void {
    this.showCustomRequestPopup = false;
    this.resetCustomRequestForm();
  }

  /**
   * Reset custom request form
   */
  private resetCustomRequestForm(): void {
    this.customDescription = '';
    this.requestError = '';
    this.requestSuccess = false;
  }
public showContinueBrowser:boolean=true;
  /**
   * Validate custom request form
   */
  private validateCustomRequest(): boolean {
    this.requestError = '';

    if (this.qrType === this.QR_TYPE_CUSTOM_WITH_DESCRIPTION) {
      if (this.customDescription.trim() === '') {
        this.requestError = 'Please enter a description';
        return false;
      }
    }

    return true;
  }

  /**
   * Submit custom request to API
   * @param description Description from user (or empty for qrType 4)
   */

  showSuccessMessage = false;
successMessage = '';
  submitCustomRequest(description: string = ''): void {
    // Validate if qrType is 5 (description required)
    if (this.qrType === this.QR_TYPE_CUSTOM_WITH_DESCRIPTION && !this.validateCustomRequest()) {
      return;
    }

    this.isLoadingRequest = true;
    this.requestError = '';

    // Prepare payload
    const payload = {
      qrId: parseInt(this.qrId, 10),
      userDeviceID: this.DEVICE_ID,
      restaurantID: parseInt(this.restaurantid, 10),
      customDescription: description || this.customDescription
    };

    console.log('📤 Sending API Request:', payload);

    // TODO: Uncomment when service is ready
    this.requestService.submitUserRequestByQR(payload).subscribe(
      (response) => {
        console.log('✅ API Response:', response);
        this.requestSuccess = true;
        this.isLoadingRequest = false;
        if (this.qrType === this.QR_TYPE_CUSTOM_IMMEDIATE) {
    this.showSuccessMessage = true;
    this.successMessage = '✅ Thank you! Your Request was sent to '+this.restaurantname;
    
  } else {
    // If qrType = 5, show popup success
    this.requestSuccess = true;
  }
      },
      (error) => {
        console.error('❌ API Error:', error);
        this.requestError = error?.error?.message || 'Failed to submit request. Please try again.';
        this.isLoadingRequest = false;
      }
    );
this.showContinueBrowser=false;
    // TEMPORARY: Remove this when service is implemented
//    this.showTemporaryMessage('Service method not implemented yet');
  }

  /**
   * Temporary message handler - Remove when service is ready
   */
  private showTemporaryMessage(message: string): void {
    this.requestError = message;
    this.isLoadingRequest = false;
  }
}