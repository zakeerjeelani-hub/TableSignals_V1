import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  Inject,
  OnDestroy,
  OnInit,
  PLATFORM_ID,
  ViewChild
} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatSortModule, MatSort } from '@angular/material/sort';
import { MatPaginatorModule, MatPaginator } from '@angular/material/paginator';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Router } from '@angular/router';

import { RestaurantService } from '../../Services/restaurant.service';
import { SuccessMessageComponent } from '../../common/success-message/success-message.component';
import { BackButtonComponent } from '../../common/back-button/back-button.component';
import { RestaurantRequest } from '../../models/restaurant-request.model';
import { TSArea } from '../../models/TSArea';
import { SessionService } from '../../Services/session.service';

// ============================================
// CONSTANTS & INTERFACES
// ============================================

const REFRESH_INTERVALS = {
  VIP_DATA: 600000,      // 10 minutes
  DASHBOARD_DATA: 30000, // 30 seconds
  CLOCK_UPDATE: 1000     // 1 second
};

const TIMEZONE_MAP: { [key: string]: string } = {
  'Asia/Kolkata': 'IST',
  'Asia/Calcutta': 'IST',
  'America/Los_Angeles': 'PST',
  'America/New_York': 'EST',
  'America/Chicago': 'CST',
  'America/Denver': 'MST',
  'Europe/London': 'GMT',
  'Europe/Paris': 'CET',
  'Australia/Sydney': 'AEDT'
};

interface VIPMembersData {
  totalVIPMembers: number;
  vipMembersToday: number;
}

interface ColorDescription {
  color: string;
  description: string;
  count: number;
}

// ============================================
// DASHBOARD COMPONENT
// ============================================

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatTableModule,
    MatSortModule,
    MatPaginatorModule,
    MatTooltipModule,
    SuccessMessageComponent,
    BackButtonComponent
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DashboardComponent implements OnInit, OnDestroy {
  // ============================================
  // PROPERTIES
  // ============================================

  // UI State
  currentDate: Date = new Date();
  popupVisible = false;
  customDescription: string = '';
  statusSuccess = false;

  // VIP Members Display
  totalVIPMembers = 0;
  vipMembersToday = 0;

  // Color Legend
  colorDescriptions: ColorDescription[] = [
    { color: '#90EE90', description: '0-5 min', count: 0 },
    { color: '#FFFF00', description: '5-10 min', count: 0 },
    { color: '#F95055', description: '10-15 min', count: 0 }
  ];

  // Table Configuration
  displayedColumns: string[] = [
    'membershipCode',
    'requestTime',
    'areaName',
    'tableName',
    'requestName',
    'timeDifference',
    'action'
  ];

  columnHeaders: { [key: string]: string } = {
    membershipCode: '⭐',
    requestTime: 'Time',
    areaName: 'Area',
    tableName: 'Table',
    requestName: 'Request',
    timeDifference: 'Timer',
    action: 'Action'
  };

  dataSource = new MatTableDataSource<RestaurantRequest>([]);
  private originalData: RestaurantRequest[] = [];

  // Filters
  selectedStatus = 'In-Progress';
  selectedArea = '';
  areas: TSArea[] = [];

  // Restaurant Info
  restaurantname?: string;
  restaurantId = 0;
  browserTimezone = '';

  // Refs
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  // Intervals
  private intervals = {
    clock: 0,
    vipData: 0,
    dashboardData: 0,
    statusTimeout: 0
  };

  // ============================================
  // CONSTRUCTOR
  // ============================================

  constructor(
    private router: Router,
    @Inject(PLATFORM_ID) private platformId: Object,
    private service: RestaurantService,
    private session: SessionService,
    private cdr: ChangeDetectorRef
  ) {
    debugger;
    this.initializeRestaurantInfo();
  }

  // ============================================
  // INITIALIZATION
  // ============================================

  private initializeRestaurantInfo(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    this.restaurantname = this.session.getItem('restaurantName') ?? undefined;
    this.restaurantId = this.session.getNumber('restaurantId', 0);

    if (this.restaurantId === 0) {
      this.router.navigate(['login']);
      return;
    }

    this.selectedArea = this.session.getItem('selectedArea') ?? '';
    this.selectedStatus = this.session.getItem('selectedStatus') ?? 'In-Progress';
  }

  ngOnInit(): void {
    this.loadAreasFromApi();
    this.fetchDataFromApi();
    this.fetchVIPMembersData();
    this.startIntervals();
  }

  private startIntervals(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    // Clock update (every second)
    this.intervals.clock = window.setInterval(
      () => {
        this.currentDate = new Date();
        this.cdr.markForCheck();
      },
      REFRESH_INTERVALS.CLOCK_UPDATE
    );

    // VIP data refresh (every 10 minutes)
    this.intervals.vipData = window.setInterval(
      () => this.fetchVIPMembersData(),
      REFRESH_INTERVALS.VIP_DATA
    );

    // Dashboard data refresh (every 30 seconds)
    this.intervals.dashboardData = window.setInterval(
      () => this.fetchDataFromApi(),
      REFRESH_INTERVALS.DASHBOARD_DATA
    );
  }

  ngOnDestroy(): void {
    this.clearAllIntervals();
  }

  private clearAllIntervals(): void {
    Object.values(this.intervals).forEach(intervalId => {
      if (intervalId) clearInterval(intervalId);
    });
  }

  // ============================================
  // DATA FETCHING
  // ============================================

  private fetchDataFromApi(): void {
    this.browserTimezone = this.detectBrowserTimezone();

    this.service.TSRestaurantDashboard(this.restaurantId, this.browserTimezone)
      .subscribe({
        next: (data: RestaurantRequest[]) => this.processRestaurantData(data),
        error: (error) => this.handleFetchError('Failed to fetch dashboard data', error)
      });
  }

  private processRestaurantData(data: RestaurantRequest[]): void {
    if (!data || data.length === 0) {
      this.originalData = [];
      this.dataSource.data = [];
      return;
    }

    this.originalData = data.map(item => ({
      ...item,
      timeDifference: this.calculateTimeDifference(
        item.requestTime,
        item.requestCompletedDate
      )
    }));

    this.dataSource.data = this.originalData;
    this.filterDashboardData();
    this.updateColorCounts();
    this.cdr.markForCheck();
  }

  private fetchVIPMembersData(): void {
    this.service.getVIPMembersData(this.restaurantId)
      .subscribe({
        next: (data: VIPMembersData) => {
          this.totalVIPMembers = data.totalVIPMembers ?? 0;
          this.vipMembersToday = data.vipMembersToday ?? 0;
          this.cdr.markForCheck();
        },
        error: (error) => this.handleFetchError('Failed to fetch VIP members', error)
      });
  }

  private loadAreasFromApi(): void {
    this.service.TSRestaurantAreas(this.restaurantId)
      .subscribe({
        next: (areas: TSArea[]) => {
          this.areas = areas;
          if (this.selectedArea) {
            this.filterDashboardData();
          }
          this.cdr.markForCheck();
        },
        error: (error) => this.handleFetchError('Failed to load areas', error)
      });
  }

  // ============================================
  // FILTERING
  // ============================================

  onAreaChange(event: any): void {
    this.selectedArea = event.value;
    if (isPlatformBrowser(this.platformId)) {
      this.session.setItem('selectedArea', this.selectedArea);
    }
    this.filterDashboardData();
  }

  onStatusChange(event: any): void {
    this.selectedStatus = event.value;
    if (isPlatformBrowser(this.platformId)) {
      this.session.setItem('selectedStatus', this.selectedStatus);
    }
    this.filterDashboardData();
  }

  private filterDashboardData(): void {
    let filtered = this.originalData;

    // Apply status filter
    switch (this.selectedStatus) {
      case 'In-Progress':
        filtered = filtered.filter(item => item.color !== 'N/A');
        break;
      case 'Completed':
        filtered = filtered.filter(item => item.color === 'N/A' && !item.status);
        break;
      case 'Not-Attended':
        filtered = filtered.filter(item => item.color === 'N/A' && item.status);
        break;
    }

    // Apply area filter
    if (this.selectedArea) {
      filtered = filtered.filter(item => item.areaName === this.selectedArea);
    }

    this.dataSource.data = filtered;
    this.resetPaginator();
    this.cdr.markForCheck();
  }

  private resetPaginator(): void {
    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  // ============================================
  // TABLE OPERATIONS
  // ============================================

  completeUserRequest(element: any): void {
    this.service.UpdateRequestStatus(element.requestID)
      .subscribe({
        next: () => this.handleRequestSuccess(),
        error: (error) => this.handleFetchError('Failed to update request', error)
      });
  }

  private handleRequestSuccess(): void {
    this.statusSuccess = true;
    this.cdr.markForCheck();

    if (this.intervals.statusTimeout) {
      clearTimeout(this.intervals.statusTimeout);
    }

    this.intervals.statusTimeout = window.setTimeout(
      () => {
        this.statusSuccess = false;
        this.cdr.markForCheck();
      },
      3000
    );

    this.fetchDataFromApi();
  }

  private updateColorCounts(): void {
    this.colorDescriptions.forEach(colorDesc => {
      colorDesc.count = this.dataSource.data.filter(
        (item: RestaurantRequest) => item.color === colorDesc.color
      ).length;
    });
  }

  // ============================================
  // POPUP MANAGEMENT
  // ============================================

  showPopup(description: string, event: MouseEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.customDescription = description;
    this.popupVisible = true;
    this.cdr.markForCheck();
  }

  closePopup(): void {
    this.popupVisible = false;
    this.cdr.markForCheck();
  }

  // ============================================
  // UTILITY METHODS
  // ============================================

  private detectBrowserTimezone(): string {
    const detectedTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    return TIMEZONE_MAP[detectedTimezone] ?? 'UTC';
  }

  private calculateTimeDifference(
    requestTime: string,
    requestCompletedDate: string | null
  ): string {
    try {
      const startDate = new Date(requestTime);
      const endDate = requestCompletedDate ? new Date(requestCompletedDate) : new Date();

      const diffMs = endDate.getTime() - startDate.getTime();
      const diffMinutes = Math.floor(diffMs / (1000 * 60));

      if (diffMinutes > 15) {
        return '-';
      }

      const hours = Math.floor(diffMinutes / 60);
      const minutes = diffMinutes % 60;

      return `${this.padZero(hours)}:${this.padZero(minutes)}`;
    } catch {
      return '-';
    }
  }

  private padZero(value: number): string {
    return value.toString().padStart(2, '0');
  }

  private handleFetchError(message: string, error: any): void {
    console.error(message, error);
    // TODO: Show snackbar/toast to user
  }

  // ============================================
  // MATERIAL TABLE INTEGRATION
  // ============================================

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  applyFilter(event: Event): void {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();
    this.resetPaginator();
  }

  trackByAreaId(_: number, area: TSArea): number { return area.areaId; }
  trackByColor(_: number, color: ColorDescription): string { return color.color; }
  trackByRequest(_: number, req: RestaurantRequest): string { return `${req.tableName}-${req.requestTime}`; }
}