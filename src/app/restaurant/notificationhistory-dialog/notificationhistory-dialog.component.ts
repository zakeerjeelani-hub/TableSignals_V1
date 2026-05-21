import { Component, OnInit, ViewChild, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, MatPaginator } from '@angular/material/paginator';
import { MatSortModule, MatSort } from '@angular/material/sort';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { CommonModule } from '@angular/common';
import { MatSpinner } from '@angular/material/progress-spinner';

// ============================================
// INTERFACES
// ============================================

// Member info interface
export interface MemberInfo {
  membershipCode: string;
  firstName: string;
  lastName: string;
  emailID: string;
  mobileNo: string;
}

// Use your existing NotificationHistory interface
export interface NotificationHistory {
  restaurantID: number;
  notificationTitle: string;
  notificationBody: string;
  sentOn: string;
  historyID: number;
  createdBy: string;
}

// Response interface for member notifications
export interface MemberNotificationsApiResponse {
  memberInfo: MemberInfo;
  notifications: NotificationHistory[];
}

// ============================================
// DIALOG COMPONENT
// ============================================

@Component({
  selector: 'app-member-notifications-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatSpinner
  ],
  templateUrl: './notificationhistory-dialog.component.html',
  styleUrl: './notificationhistory-dialog.component.scss'
})
export class NotificationHistoryDialogComponent implements OnInit {

  // ============================================
  // PROPERTIES
  // ============================================
  memberInfo: MemberInfo | null = null;
  notificationsDataSource = new MatTableDataSource<NotificationHistory>([]);
  isLoading = false;

  // Table columns - MATCHING YOUR NotificationHistory INTERFACE
  displayedColumns: string[] = [
    'sentOn',
    'notificationTitle',
    'notificationBody',
    'createdBy'
  ];

  columnHeaders: { [key: string]: string } = {
    sentOn: 'Sent On',
    notificationTitle: 'Title',
    notificationBody: 'Message',
    createdBy: 'Sent By'
  };

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  // ============================================
  // CONSTRUCTOR
  // ============================================
  constructor(
    public dialogRef: MatDialogRef<NotificationHistoryDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: {
      memberInfo: MemberInfo;
      notifications: NotificationHistory[];
    }
  ) {}

  // ============================================
  // LIFECYCLE
  // ============================================
  ngOnInit(): void {
    this.loadNotifications();
  }

  ngAfterViewInit(): void {
    this.notificationsDataSource.paginator = this.paginator;
    this.notificationsDataSource.sort = this.sort;
  }

  // ============================================
  // LOAD NOTIFICATIONS
  // ============================================
  loadNotifications(): void {
    this.isLoading = true;
    // Set member info
    this.memberInfo = this.data.memberInfo;
    
    // Load notifications
    this.notificationsDataSource.data = this.data.notifications || [];
    
    // Setup filter
    this.notificationsDataSource.filterPredicate = (
      data: NotificationHistory,
      filter: string
    ): boolean => {
      if (!filter) return true;
      const filterValue = filter.trim().toLowerCase();
      return (
        data.notificationTitle.toLowerCase().includes(filterValue) ||
        data.notificationBody.toLowerCase().includes(filterValue) ||
        data.createdBy.toLowerCase().includes(filterValue)
      );
    };
    
    this.isLoading = false;
  }

  // ============================================
  // FILTER NOTIFICATIONS
  // ============================================
  applyFilter(event: Event): void {
    const filterValue = (event.target as HTMLInputElement).value;
    this.notificationsDataSource.filter = filterValue.trim().toLowerCase();

    if (this.notificationsDataSource.paginator) {
      this.notificationsDataSource.paginator.firstPage();
    }
  }

  // ============================================
  // FORMAT DATE
  // ============================================
  formatDate(dateString: string): string {
    try {
      const date = new Date(dateString);
      return date.toLocaleString();
    } catch {
      return dateString;
    }
  }

  // ============================================
  // CLOSE DIALOG
  // ============================================
  closeDialog(): void {
    this.dialogRef.close();
  }
}
