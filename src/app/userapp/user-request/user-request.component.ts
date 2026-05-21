import { AfterViewInit, Component, Inject, OnDestroy, OnInit, PLATFORM_ID } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { MatGridListModule } from '@angular/material/grid-list';
import { FormArray, FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { TopMenuComponent } from '../../layout/top-menu/top-menu.component';
import { RestaurantService } from '../../Services/restaurant.service';
import { ActivatedRoute, Router } from '@angular/router';
import { SuccessMessageComponent } from '../../common/success-message/success-message.component';
import { GoogleTranslateComponent } from '../google-translate/google-translate.component';
import { PopupMessageComponent } from '../../common/popup-message/popup-message.component';
import { AdsenseComponent } from '../../common/adsense/adsense.component';
import { Subscription, interval } from 'rxjs';
import { QrSessionManagerService } from '../../Services/QRSessionManagerService';

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
  selector: 'app-user-request',
  standalone: true,
  imports: [
    CommonModule,
    MatGridListModule,
    MatCardModule,
    MatButtonModule,
    GoogleTranslateComponent,
    SuccessMessageComponent,
    PopupMessageComponent,
    AdsenseComponent,
    FormsModule
  ],
  templateUrl: './user-request.component.html',
  styleUrl: './user-request.component.scss'
})
export class UserRequestComponent implements AfterViewInit, OnInit, OnDestroy {
  menuItems = [
    { label: 'VIP', icon: 'assets/icons/VIPIcon.png', api: '0' },
    { label: 'Menu', icon: 'assets/icons/menu.png', api: '2' },
    { label: 'Order', icon: 'assets/icons/order1.png', api: '1' },
    { label: 'Refill', icon: 'assets/icons/refill2.png', api: '4' },
    { label: 'Water', icon: 'assets/icons/water.png', api: '3' },
    { label: 'Bill', icon: 'assets/icons/bill.png', api: '5' },
    { label: 'Silverware', icon: 'assets/icons/silverware.png', api: '6' },
    { label: 'Questions', icon: 'assets/icons/questions1.png', api: '8' },
    { label: 'Custom', icon: 'assets/icons/custom1.png', api: '9' }
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
  
  // 🔑 KEY FLAG: Track where tableid came from
  // true = from URL (use TSUserRequest - old API)
  // false = entered by user (use TSUserRequestByTableNo - new API)
  tableIdFromUrl: boolean = false;
  
  // Private subscriptions
  private sessionSubscription: Subscription | null = null;
  private timerSubscription: Subscription | null = null;
  
  constructor(
    private http: HttpClient,
    private service: RestaurantService, 
    private qrSessionManager: QrSessionManagerService,
    private route: ActivatedRoute, 
    private router: Router,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    if (isPlatformBrowser(this.platformId)) {
      this.route.queryParams.subscribe(params => {
        this.restaurantid = params['restaurantid'] ? params['restaurantid'] : null;
        this.tableid = params['tableid'] ? params['tableid'] : null;
        this.restaurantname = params['restaurantname'] ? params['restaurantname'] : null;
        this.keyword = params['keyword'] ? params['keyword'] : null;
        this.qrType = params['qrType'] ? params['qrType'] : null;

        // 🔑 Set flag: Check if tableid came from URL
        this.tableIdFromUrl = !!this.tableid; // true if tableid exists, false if null
        
        console.log('TableID Status:', {
          tableid: this.tableid,
          tableIdFromUrl: this.tableIdFromUrl,
          willUseAPI: this.tableIdFromUrl ? 'TSUserRequest (OLD)' : 'TSUserRequestByTableNo (NEW)'
        });

        if (this.qrType === '1') {
          return;
        }

        if (this.restaurantid && this.tableid) {
          this.qrSessionManager.initSession(params);
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
        this.hasValidSession = session.isValid;
        
        if (!session.isValid && (this.restaurantid && this.tableid) && 
            (this.qrType !== '1' || this.isTableNumberSubmitted)) {
          this.showSessionExpiredMessage();
          this.clearQueryParams();
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
  }

  openVipPopup(): void {
    this.qrSessionManager.updateActivity();
    if (!this.hasValidSession) {
      this.showSessionExpiredMessage();
      return;
    }
    this.showVipPopup = true;
  }

  closeVipPopup(): void {
    this.showVipPopup = false;
  }

  downloadVipApp(): void {
    alert('Redirecting to Table Signals App Download...');
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    if (isIOS) {
      window.open('https://apps.apple.com/in/app/table-signals/id6462874524', '_blank');
    } else {
      window.open('https://play.google.com/store/apps/details?id=com.rattletech.TableSignalApp&hl=en_IN&pli=1', '_blank');
    }
    this.closeVipPopup();
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
}