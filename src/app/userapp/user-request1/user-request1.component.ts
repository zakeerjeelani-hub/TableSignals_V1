import { AfterViewInit, Component, Inject, OnDestroy, OnInit, PLATFORM_ID } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FormArray, FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule, isPlatformBrowser, Location } from '@angular/common';
import { TopMenuComponent } from '../../layout/top-menu/top-menu.component';
import { RestaurantService, MembershipEligibilityCheckRequest, MembershipSignUpRequest } from '../../Services/restaurant.service';
import { ActivatedRoute, Router } from '@angular/router';
import { GoogleTranslateComponent } from '../google-translate/google-translate.component';
import { CustomMessageComponent } from '../custom-message/custom-message.component';
import { PopupMessageComponent } from '../../common/popup-message/popup-message.component';
import { AdsenseComponent } from '../../common/adsense/adsense.component';
import { Subscription, interval } from 'rxjs';
import { QrSessionManagerService } from '../../Services/QRSessionManagerService';
import { Clipboard } from '@angular/cdk/clipboard';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIcon } from '@angular/material/icon';

// Entity interface for TSTableUserRequest (NEW API)
interface TSTableUserRequest {
  requestTypeID: number;
  userDeviceID: string;
  tableNo: number;
  restaurantID: number;
  requestTimeString?: string;
  customDescription: string;
}

@Component({
  selector: 'app-user-request1',
  standalone: true,
  imports: [
    CommonModule,
    GoogleTranslateComponent,
    PopupMessageComponent,
    AdsenseComponent,
    FormsModule,
    MatProgressSpinnerModule,
    MatIcon,
    CustomMessageComponent
  ],
  templateUrl: './user-request1.component.html',
  styleUrls: ['./user-request1.component.scss']
})
export class UserRequest1Component implements AfterViewInit, OnInit, OnDestroy {
  menuItems = [
    { label: 'VIP', icon: 'assets/icons/VIPIcon.png', api: '0' },
    { label: 'Menu', icon: 'assets/icons/menu.png', api: '2' },
    { label: 'Order', icon: 'assets/icons/order1.png', api: '1' },
    { label: 'Refill', icon: 'assets/icons/refill2.png', api: '4' },
    { label: 'Water', icon: 'assets/icons/water.png', api: '3' },
    { label: 'Bill', icon: 'assets/icons/bill.png', api: '5' },
    { label: 'Silverware', icon: 'assets/icons/silverware.png', api: '6' },
    { label: 'TakeOutbox', icon: 'assets/icons/Take.png', api: '7' },
    { label: 'Questions', icon: 'assets/icons/questions1.png', api: '8' },
    { label: 'Custom', icon: 'assets/icons/custom1.png', api: '9' },
    { label: 'Restroom', icon: 'assets/icons/restroom.png', api: '10' }
  ];
  
  enableService: boolean = true;
  tableid: any;
  restaurantid: any;
  restaurantname: any;
  uploadSuccess: boolean = false;
  RequestSuccess: boolean = false;
  popupMessage: string = '';
  showPopup: boolean = false;
  showCustomPopup: boolean = false;
  customDescription: string = '';
  showVipPopup: boolean = false;
  hasValidSession: boolean = false;
  showScanAgainPopup: boolean = false;
  scanAgainTitle: string = 'Session Expired';
  scanAgainMessage: string = 'Your session has expired. Please scan the QR code again to continue.';
  sessionTimeRemaining: string = '10:00';
  selectedRequestTypeId: Number = 0;
  popupTitle: string = 'Enter Custom Request';
  popupDesc: string = '';
  keyword: string = '';
  qrType: string = '';
  showTableNumberPopup: boolean = false;
  tableNumberInput: string = '';
  isTableNumberSubmitted: boolean = false;
  isValidatingTable: boolean = false;
  tablePopupView: 'table-number' | 'custom-message' = 'table-number';
  noTableCustomMsg = '';
  isSendingNoTableMsg = false;
  
  // 🔑 KEY FLAG: Track where tableid came from
  // true = from URL (use TSUserRequest - old API)
  // false = entered by user (use TSUserRequestByTableNo - new API)
  tableIdFromUrl: boolean = false;

  // Tracks whether the session was ever valid in this page load.
  // Prevents "session expired" popup from firing during initSession's
  // brief clearSession() emission on page refresh.
  private sessionWasEverValid: boolean = false;

  // ============================================
  // VIP MEMBERSHIP FLOW PROPERTIES
  // ============================================
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
  
  // Private subscriptions
  private sessionSubscription: Subscription | null = null;
  private timerSubscription: Subscription | null = null;
  
  constructor(
    private http: HttpClient,
    private service: RestaurantService,
    private qrSessionManager: QrSessionManagerService,
    private route: ActivatedRoute,
    private router: Router,
    private location: Location,
    private clipboard: Clipboard,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    if (isPlatformBrowser(this.platformId)) {
      this.route.queryParams.subscribe(params => {
        // Detect if this is a page refresh (no URL params at all)
        const isRefresh = !params['restaurantid'] && !params['qrType'];

        // Try URL params first, fall back to sessionStorage if missing
        this.restaurantid = params['restaurantid'] || sessionStorage.getItem('ts_restaurantid') || null;
        this.restaurantname = params['restaurantname'] || sessionStorage.getItem('ts_restaurantname') || null;
        this.keyword = params['keyword'] || sessionStorage.getItem('ts_keyword') || null;
        this.qrType = params['qrType'] || sessionStorage.getItem('ts_qrType') || '2';

        // For qrType=1, tableid is entered by the user — only restore it from sessionStorage on refresh.
        // On a fresh qrType=1 scan, tableid must be null so the table number popup shows.
        if (this.qrType === '1' && !isRefresh) {
          this.tableid = params['tableid'] || null;
        } else {
          this.tableid = params['tableid'] || sessionStorage.getItem('ts_tableid') || null;
        }

        // Persist to sessionStorage so values survive page refresh
        if (this.restaurantid) sessionStorage.setItem('ts_restaurantid', this.restaurantid);
        if (this.tableid) sessionStorage.setItem('ts_tableid', this.tableid);
        if (this.restaurantname) sessionStorage.setItem('ts_restaurantname', this.restaurantname);
        if (this.keyword) sessionStorage.setItem('ts_keyword', this.keyword);
        if (this.qrType) sessionStorage.setItem('ts_qrType', this.qrType);

        // Restore isTableNumberSubmitted if tableid was manually entered (came from storage on refresh)
        if (isRefresh && this.tableid && this.qrType === '1') {
          this.isTableNumberSubmitted = true;
          this.tableIdFromUrl = false;
        } else {
          this.tableIdFromUrl = !!params['tableid'];
        }

        if (this.qrType === '1') {
          if (this.restaurantid && this.tableid && this.isTableNumberSubmitted) {
            this.qrSessionManager.initSession({
              restaurantid: this.restaurantid,
              tableid: this.tableid,
              restaurantname: this.restaurantname,
              keyword: this.keyword,
              qrType: this.qrType
            });
          }
          return;
        }

        if (this.restaurantid && this.tableid) {
          this.qrSessionManager.initSession(params['restaurantid'] ? params : {
            restaurantid: this.restaurantid,
            tableid: this.tableid,
            restaurantname: this.restaurantname,
            keyword: this.keyword,
            qrType: this.qrType
          });
        } else {
          this.showSessionExpiredMessage();
        }
      });
    }
  }
  
  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.service.TSGetEnableDisableService(this.restaurantid).subscribe(
        response => {
          this.enableService = response.isServiceEnabled;
          if (this.enableService) {
            if (this.keyword == null) {
              this.service.GetRestaurantNameByRestaurantId(this.restaurantid).subscribe(
                response => {
                  const res = response.restaurantName;
                  this.restaurantname = res;
                  this.keyword = 'RestApp';
                  this.showWelcomePopupAfterDataLoad();
                },
                error => {
                  console.error('Registration failed', error);
                }
              );
            } else {
              this.showWelcomePopupAfterDataLoad();
            }
          }
        },
        error => {
          console.error('Registration failed', error);
        }
      );

      this.sessionSubscription = this.qrSessionManager.getSessionData().subscribe(session => {
        if (session.isValid) {
          this.sessionWasEverValid = true;
        }

        this.hasValidSession = session.isValid;

        if (!session.isValid && this.sessionWasEverValid &&
            (this.restaurantid && this.tableid) &&
            (this.qrType !== '1' || this.isTableNumberSubmitted)) {
          this.showSessionExpiredMessage();
          this.clearQueryParams();
          this.clearSessionStorage();
        }
      });
      
      this.startSessionTimer();
    }
  }
  
  ngAfterViewInit() {
    if (this.enableService) {
      // Welcome popup shown after data loads
    }
  }

  private showWelcomePopupAfterDataLoad(): void {
    if (this.enableService && (this.hasValidSession || this.qrType === '1')) {
      setTimeout(() => {
        this.popupMessage = `You are Connected\nWelcome to ${this.restaurantname}\n. Tap here anytime to request what you need! We are here to help!`;
        this.showPopup = true;
      }, 500);
    }
  }

  ngOnDestroy(): void {
    if (this.sessionSubscription) {
      this.sessionSubscription.unsubscribe();
    }
    
    if (this.timerSubscription) {
      this.timerSubscription.unsubscribe();
    }
  }
  
  private startSessionTimer(): void {
    if (this.timerSubscription) {
      this.timerSubscription.unsubscribe();
    }
    
    this.timerSubscription = interval(1000).subscribe(() => {
      if (this.hasValidSession) {
        const sessionData = this.qrSessionManager.getSessionRemainingTime();
        if (sessionData > 0) {
          const minutes = Math.floor(sessionData / 60000);
          const seconds = Math.floor((sessionData % 60000) / 1000);
          this.sessionTimeRemaining = `${minutes}:${seconds.toString().padStart(2, '0')}`;
        }
      }
    });
  }
  
  private showSessionExpiredMessage(): void {
    if (this.qrType === '1' && this.isTableNumberSubmitted) {
      return;
    }
    
    this.scanAgainMessage = 'Your session has expired. Please scan the QR code again to continue.';
    this.showScanAgainPopup = true;
  }
  
  private clearQueryParams(): void {
    if (isPlatformBrowser(this.platformId)) {
      const baseUrl = this.router.url.split('?')[0];
      window.history.replaceState({}, '', baseUrl);
    }
  }

  private clearSessionStorage(): void {
    sessionStorage.removeItem('ts_restaurantid');
    sessionStorage.removeItem('ts_tableid');
    sessionStorage.removeItem('ts_restaurantname');
    sessionStorage.removeItem('ts_keyword');
    sessionStorage.removeItem('ts_qrType');
  }
  
  refreshSession(): void {
    this.qrSessionManager.updateActivity();
  }
  
  closeScanAgainPopup(): void {
    this.showScanAgainPopup = false;
  }
  
  closePopup(): void {
    this.showPopup = false;
    
    if (this.qrType === '1' && !this.isTableNumberSubmitted) {
      setTimeout(() => {
        this.showTableNumberPopup = true;
      }, 300);
    }
  }

  /**
   * Submit table number from user input with validation
   */
  submitTableNumber(): void {
    if (!this.tableNumberInput.trim()) {
      alert('Please enter a valid table number');
      return;
    }

    const tableNo = this.convertTableIdToNumber(this.tableNumberInput.trim());
    
    // Validate table exists in restaurant using GetRestaurantDetails API
    this.validateTableNumber(tableNo);
  }

  /**
   * Validate if table number exists in restaurant
   */
  private validateTableNumber(tableNo: number): void {
    console.log('🔍 Validating table number:', tableNo);
    this.isValidatingTable = true;

    this.service.GetRestaurantDetails(Number(this.restaurantid), tableNo, false).subscribe(
      response => {
        console.log('✅ Table validation response:', response);
        this.isValidatingTable = false;
        
        // Check if table exists (response should indicate valid table)
        if (response && response.status=='Success') {
          // Table is valid - proceed with submission
          this.tableid = this.tableNumberInput.trim();
          this.isTableNumberSubmitted = true;
          this.showTableNumberPopup = false;
          this.tableNumberInput = '';

          // Persist manually-entered tableid so it survives page refresh
          sessionStorage.setItem('ts_tableid', this.tableid);

          // 🔑 KEY: Set flag to false since this tableid is entered by user (NOT from URL)
          this.tableIdFromUrl = false;
          
          console.log('✅ Table number validated and submitted by user:', {
            tableid: this.tableid,
            tableNo: tableNo,
            tableIdFromUrl: this.tableIdFromUrl,
            willUseAPI: 'TSUserRequestByTableNo (NEW)'
          });

          if (this.restaurantid && this.tableid) {
            const params = {
              restaurantid: this.restaurantid,
              tableid: this.tableid,
              restaurantname: this.restaurantname,
              keyword: this.keyword,
              qrType: this.qrType
            };

            setTimeout(() => {
              this.qrSessionManager.initSession(params);
            }, 500);
          } else {
            this.showSessionExpiredMessage();
          }
        } else {
          // Table doesn't exist
          this.showTableValidationError();
        }
      },
      error => {
        console.error('❌ Table validation error:', error);
        this.isValidatingTable = false;
        this.showTableValidationError();
      }
    );
  }

  /**
   * Show error message for invalid table number
   */
  private showTableValidationError(): void {
    alert('❌ Invalid Table Number\n\nThe table number you entered does not exist in this restaurant.\n\nPlease check and try again.');
    this.tableNumberInput = '';
  }

  closeTableNumberPopup(): void {
    this.showTableNumberPopup = false;
    this.tableNumberInput = '';
    this.tablePopupView = 'table-number';
  }

  cancelTableNumberPopup(): void {
    this.closeTableNumberPopup();
    this.location.back();
  }

  openCustomMsgView(): void {
    this.tablePopupView = 'custom-message';
  }

  backToTableNumber(): void {
    this.tablePopupView = 'table-number';
    this.noTableCustomMsg = '';
  }

  sendNoTableMsg(): void {
    if (!this.noTableCustomMsg.trim() || this.isSendingNoTableMsg) return;

    const payload = {
      RequestTypeID: 19,
      UserDeviceID: 'abc',
      RestaurantID: Number(this.restaurantid),
      CustomDescription: this.noTableCustomMsg.trim()
    };

    this.isSendingNoTableMsg = true;

    this.service.TSUserRequestByType(payload).subscribe({
      next: () => {
        this.isSendingNoTableMsg = false;
        this.popupMessage = 'Message sent! Our team will assist you shortly.';
        this.showPopup = true;
        this.closeTableNumberPopup();
      },
      error: (error) => {
        this.isSendingNoTableMsg = false;
        console.error('TSUserRequestByType error:', error);
      }
    });
  }

  openVipPopup(): void {
    this.qrSessionManager.updateActivity();
    if (!this.hasValidSession) {
      this.showSessionExpiredMessage();
      return;
    }
    this.resetVipForm();
    this.showVipPopup = true;
  }

  /**
   * Submit custom request - Intelligently chooses between old and new API based on tableIdFromUrl flag
   */
  submitCustomRequest(): void {
    this.qrSessionManager.updateActivity();
    
    if (!this.hasValidSession) {
      this.showSessionExpiredMessage();
      this.showCustomPopup = false;
      return;
    }
    
    // 🔑 DECISION LOGIC: Choose API based on tableid source
    if (this.tableIdFromUrl) {
      // TableID came from URL → Use OLD API
      this.submitCustomRequestUsingOldAPI();
    } else {
      // TableID entered by user → Use NEW API
      this.submitCustomRequestUsingNewAPI();
    }
  }

  /**
   * Submit using NEW TSUserRequestByTableNo API (when user enters table manually)
   */
  private submitCustomRequestUsingNewAPI(): void {
    const tableNoValue = this.convertTableIdToNumber(this.tableid);
    const d = new Date();
    const userRequest= {
      requestTypeID: Number(this.selectedRequestTypeId),
      userDeviceID: 'abc',
      tableNo: tableNoValue,
      restaurantID: Number(this.restaurantid),
      requestTime: d,
      customDescription: this.customDescription
    };

    console.log('📤 Submitting using TSUserRequestByTableNo (NEW API):', userRequest);

    this.service.TSUserRequestByTableNo(userRequest).subscribe(
      response => {
        console.log('✅ TSUserRequestByTableNo Response:', response);
        this.popupMessage = `Request received`;
        this.showPopup = true;
        this.showCustomPopup = false;
        this.customDescription = '';
      },
      error => {
        console.error('❌ TSUserRequestByTableNo Error:', error);
      }
    );
  }

  /**
   * Submit using OLD TSUserRequest API (when tableid from URL)
   */
  private submitCustomRequestUsingOldAPI(): void {
    const d = new Date();
    const tSUserRequest = {
      requestTypeID: Number(this.selectedRequestTypeId),
      userDeviceID: 'abc',
      tableID: this.tableid,
      restaurantID: Number(this.restaurantid),
      requestTime: d,
      customDescription: this.customDescription
    };

    console.log('📤 Submitting using TSUserRequest (OLD API):', tSUserRequest);

    this.service.TSUserRequest(tSUserRequest).subscribe(
      response => {
        console.log('✅ TSUserRequest Response:', response);
        this.popupMessage = `Request received`;
        this.showPopup = true;
        this.showCustomPopup = false;
        this.customDescription = '';
      },
      error => {
        console.error('❌ TSUserRequest API Error:', error);
      }
    );
  }

  /**
   * Convert table ID to number (for new API)
   */
  private convertTableIdToNumber(tableId: any): number {
    if (typeof tableId === 'number') {
      return tableId;
    }
    if (typeof tableId === 'string') {
      const parsed = parseInt(tableId, 10);
      if (!isNaN(parsed)) {
        return parsed;
      }
      return this.stringToNumber(tableId);
    }
    return 0;
  }

  /**
   * Convert string to number using hash (for alphanumeric table names)
   */
  private stringToNumber(str: string): number {
    let hash = 0;
    if (str.length === 0) return hash;
    
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash);
  }

  /**
   * Format date time string in required format: "yyyy-MM-dd HH:mm:ss.fff"
   */
  private formatDateTimeString(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    const milliseconds = String(date.getMilliseconds()).padStart(3, '0');

    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}.${milliseconds}`;
  }

  /**
   * Handle menu item click
   */
  onItemClick(item: any): void {
    if (item.api == '0') {
      this.openVipPopup();
      return;
    }

    this.qrSessionManager.updateActivity();
    
    if (!this.hasValidSession) {
      this.showSessionExpiredMessage();
      return;
    }
    
    switch (item.api) {
      case '1':
        {
          this.selectedRequestTypeId = Number(item.api);
          this.popupTitle = "Almost There!";
          this.popupDesc = "Want to add a note on your Order? Type it in (e.g. drink type, extra napkins), type it below. Otherwise, just press Submit to notify the team.";
          this.showCustomPopup = true;
          return; 
        }
      case '4':
        {
          this.selectedRequestTypeId = Number(item.api);
          this.popupTitle = "Let's Get That Refill Started!";
          this.popupDesc = "Help us get it right — tell us what you were drinking (e.g., Diet Coke, Type of Beer). Type it in or simply press Submit to notify the staff.";
          this.showCustomPopup = true;
          return; 
        }
      case '8':
        {
          this.selectedRequestTypeId = Number(item.api);
          this.popupTitle = "Got a Quick Question?";
          this.popupDesc = "Let us know what you need by typing your question (e.g. \"Can I see the dessert menu?\"). If you'd rather ask in person, just tap Submit.";
          this.showCustomPopup = true;
          return; 
        }
      case '9':
        {
          this.selectedRequestTypeId = Number(item.api);
          this.popupTitle = "Custom Request";
          this.popupDesc = "Enter Custom Request";
          this.showCustomPopup = true;
          return;
        }
      default:
        break;
    }
    
    // Direct API calls for items that don't need custom popup
    this.submitDirectRequest(item);
  }

  /**
   * Submit direct request (for Menu, Water, Bill, etc.)
   */
  private submitDirectRequest(item: any): void {
    if (item.api == 2) {
      this.router.navigate(['/showmenu'], {
        queryParams: {
          restaurantid: this.restaurantid,
          tableid: this.tableid,
          restaurantname: this.restaurantname,
          customDescription: ""
        },
      });
    } else {
      // 🔑 DECISION LOGIC: Choose API based on tableid source
      if (this.tableIdFromUrl) {
        // TableID came from URL → Use OLD API
        this.submitDirectRequestUsingOldAPI(item);
      } else {
        // TableID entered by user → Use NEW API
        this.submitDirectRequestUsingNewAPI(item);
      }
    }
  }

  /**
   * Submit direct request using NEW API (when user enters table manually)
   */
  private submitDirectRequestUsingNewAPI(item: any): void {
    const tableNoValue = this.convertTableIdToNumber(this.tableid);
    const d = new Date();
    
    const userRequest = {
      requestTypeID: Number(item.api),
      userDeviceID: 'abc',
      tableNo: tableNoValue,
      restaurantID: Number(this.restaurantid),
      requestTime: d,
      customDescription: ''
    };

    console.log('📤 Direct request using TSUserRequestByTableNo (NEW API):', userRequest);

    this.service.TSUserRequestByTableNo(userRequest).subscribe(
      response => {
        console.log('✅ Direct request response:', response);
        this.popupMessage = `Request Received\nOur team has been notified and will assist you shortly\nThank you for your patience.`;
        this.showPopup = true;
      },
      error => {
        console.error('❌ Direct request error:', error);
      }
    );
  }

  /**
   * Submit direct request using OLD API (when tableid from URL)
   */
  private submitDirectRequestUsingOldAPI(item: any): void {
    const d = new Date();
    const tSUserRequest = {
      requestTypeID: item.api,
      userDeviceID: 'abc',
      tableID: this.tableid,
      restaurantID: this.restaurantid,
      requestTime: d,
      customDescription: ''
    };

    console.log('📤 Direct request using TSUserRequest (OLD API):', tSUserRequest);

    this.service.TSUserRequest(tSUserRequest).subscribe(
      response => {
        this.popupMessage = `Request Received\nOur team has been notified and will assist you shortly\nThank you for your patience.`;
        this.showPopup = true;
      },
      error => {
        console.error('❌ API Error:', error);
      }
    );
  }
onlyIntegerInput(event: KeyboardEvent): void {
  const char = String.fromCharCode(event.which);
  if (!/[0-9]/.test(char)) {
    event.preventDefault();
  }
}

  // ============================================
  // VIP MEMBERSHIP FLOW METHODS
  // ============================================

  /**
   * Close VIP popup
   */
  closeVipPopup(): void {
    this.showVipPopup = false;
    this.resetVipForm();
  }

  /**
   * Reset VIP form to initial state
   */
  private resetVipForm(): void {
    this.vipFirstName = '';
    this.vipLastName = '';
    this.vipBirthDay = '';
    this.vipBirthMonth = null;
    this.vipMobileNo = '';
    this.vipEmailID = '';
    this.vipCity = '';
    this.vipError = '';
    this.isVipSubmitting = false;
    this.isVipChecking = false;
    this.vipSubmitted = false;
    this.showVipRegistrationForm = false;
    this.referralCode = '';
    this.vipResultType = 'none';
    this.vipSuccessTitle = '';
    this.vipSuccessMessage = '';
    this.showReferralCode = false;
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

  copyCode(code: string): void {
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

    this.service.membershipSignUp(payload).subscribe({
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

    this.service.checkMembershipEligibility(payload).subscribe({
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
      window.open('https://apps.apple.com/in/app/table-signals/id6462874524', '_blank');
    } else {
      window.open('https://play.google.com/store/apps/details?id=com.rattletech.TableSignalApp&hl=en_IN&pli=1', '_blank');
    }
    this.closeVipPopup();
  }
}