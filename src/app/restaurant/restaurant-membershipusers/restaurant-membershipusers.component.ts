// ============================================
// CORRECTED COMPONENT CODE
// ============================================

// File: restaurant-membershipusers.component.ts

import { Component, OnInit, ViewChild, OnDestroy } from '@angular/core';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { CommonModule } from '@angular/common';
import { RestaurantService } from '../../Services/restaurant.service';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';

import { LeftMenuComponent } from '../../layout/left-menu/left-menu.component';
import { TopMenuComponent } from '../../layout/top-menu/top-menu.component';
import { Router } from '@angular/router';
import { BackButtonComponent } from '../../common/back-button/back-button.component';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { SelectionModel } from '@angular/cdk/collections';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatListModule } from '@angular/material/list';
import { MatCardModule } from '@angular/material/card';
import { MatTabsModule } from '@angular/material/tabs';
import { NotificationDialogComponent } from '../notification-dialog/notification-dialog.component';
import { NotificationHistoryDialogComponent } from '../notificationhistory-dialog/notificationhistory-dialog.component';
import { SessionService } from '../../Services/session.service';

// ============================================
// INTERFACES
// ============================================

export interface NotificationHistory {
  masterId: string;           // Guid
  restaurantID: number;
  historyID: number;
  notificationTitle: string;
  notificationBody: string;
  deviceToken: string;
  createdBy: string;
  sentTo: string;
  sentOn: string;
}

// Parent group (derived from raw data)
export interface NotificationHistoryGroup {
  masterId: string;
  notificationTitle: string;
  notificationBody: string;
  sentOn: string;
  sentTo: string;
  createdBy: string;
  recipientCount: number;      // how many child records
  children: NotificationHistory[];
  isExpanded: boolean;
}
export interface MembershipUser {
  membershipId: number;
  firstName: string;
  lastName: string;
  birthDay: string;
  birthMonth: number;
  mobileNo: string;
  emailID: string;
  city: string;
  latitude: string;
  longitude: string;
  firebaseToken: string;
  deviceToken: string;
  membershipCode: string;
  createdOn: string;
  restaurantId: number;
  totalRequests: number;
  totalDeals: number;
  totalVisits: number;
}

// export interface NotificationHistory {
//   restaurantID: number;
//   notificationTitle: string;
//   notificationBody: string;
//   sentOn: string;
//   historyID: number;
//   createdBy: string;
// }

// NEW: Member Notification Interface
export interface MemberNotification {
  notificationId: number;
  membershipCode: string;
  notificationTitle: string;
  notificationBody: string;
  sentOn: string;
  status: 'delivered' | 'read' | 'failed' | 'pending';
  createdBy: string;
}

// NEW: Member Notifications Response Interface
export interface MemberNotificationsResponse {
  membershipCode: string;
  firstName: string;
  lastName: string;
  emailID: string;
  mobileNo: string;
  notifications: MemberNotification[];
}
export interface NotificationTemplate {
  templateID: number;
  restaurantId: number;
  templateName: string;
  notificationTitle: string;
  notificationBody: string;
  createdOn: string;
  createdBy: string;
}

// ============================================
// COMPONENT
// ============================================

@Component({
  selector: 'app-restaurant-membershipusers',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatInputModule,
    MatFormFieldModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    // LeftMenuComponent,
    // TopMenuComponent,
    BackButtonComponent,
    MatCheckboxModule,
    MatDialogModule,
    MatSnackBarModule,
    MatListModule,
    MatCardModule,
    MatTabsModule,
    //NotificationDialogComponent,
    //NotificationHistoryDialogComponent
  ],
  templateUrl: './restaurant-membershipusers.component.html',
  styleUrl: './restaurant-membershipusers.component.scss'
})
export class RestaurantMembershipusersComponent implements OnInit, OnDestroy {
  templates: NotificationTemplate[] = [];
isLoadingTemplates: boolean = false;
notificationTemplatesDataSource = new MatTableDataSource<NotificationTemplate>([]);

// Add @ViewChild for templates paginator/sort (optional - only if adding templates tab):
@ViewChild('templatesPaginator') templatesPaginator!: MatPaginator;
@ViewChild('templatesSort') templatesSort!: MatSort;
  // ============================================
  // DATA SOURCES
  // ============================================
  dataSource = new MatTableDataSource<MembershipUser>([]);
  notificationHistoryDataSource = new MatTableDataSource<NotificationHistory>([]);
  notificationHistoryGroups: NotificationHistoryGroup[] = [];
expandedGroupId: string | null = null;
  private originalData: MembershipUser[] = [];
  private notificationHistory: NotificationHistory[] = [];
  selection = new SelectionModel<MembershipUser>(true, []);
historyColumns: string[] = [
  'expand',
  'notificationTitle',
  'notificationBody',
  'sentOn',
  'createdBy',
  'recipientCount'
];
childColumns: string[] = [
  'historyID',
  'deviceToken'
];

historyColumnHeaders: { [key: string]: string } = {
  expand: '',
  notificationTitle: 'Title',
  notificationBody: 'Message',
  sentOn: 'Sent On',
  createdBy: 'Sent By',
  recipientCount: 'Recipients'
};
  // ============================================
  // VIEWCHILD REFERENCES
  // ============================================
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;
  @ViewChild('historyPaginator') historyPaginator!: MatPaginator;
  @ViewChild('historySort') historySort!: MatSort;

  // ============================================
  // COLUMN DEFINITIONS
  // ============================================
  displayedColumns: string[] = [
    'select',
    'firstName',
    'lastName',
    'createdOn',
    'details',
    'notifications'
  ];



  columnHeaders: { [key: string]: string } = {
    select: 'Select',
    firstName: 'First Name',
    lastName: 'Last Name',
    createdOn: 'Created On',
    details: 'Details',
    notifications: 'Notify'
  };

 

  // ============================================
  // STATE MANAGEMENT
  // ============================================
  isLoading: boolean = false;
  isLoadingHistory: boolean = false;
  isLoadingMemberNotifications: boolean = false; // NEW
  errorMessage: string = '';
  restaurantId: number = 0;
  selectedMember: MembershipUser | null = null; // NEW
  private refreshIntervalId: any;
  activeTab: number = 0;

  // ============================================
  // CONSTRUCTOR
  // ============================================
  constructor(
    private router: Router,
    private service: RestaurantService,
    private session: SessionService,
    public dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {
    this.restaurantId = this.session.getNumber('restaurantId');
  }
convertUtcToBrowserTimezone(utcDateString: string): string {
  try {
    const browserTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    
    // Add 'Z' to the end if it's not already there
    const utcString = utcDateString.endsWith('Z') ? utcDateString : utcDateString + 'Z';
    const utcDate = new Date(utcString);
    
 
    
    const formattedDate = new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      timeZone: browserTimezone
    }).format(utcDate);
    
    return formattedDate;
  } catch (error) {
    console.error('Error converting timezone:', error);
    return utcDateString;
  }
}
  // ============================================
  // LIFECYCLE HOOKS
  // ============================================
  ngOnInit(): void {
    this.fetchMembershipUsers();
    this.fetchNotificationHistory();
    this.dataSource.filterPredicate = this.customFilterPredicate();
    this.notificationHistoryDataSource.filterPredicate = this.customHistoryFilterPredicate();
     this.fetchNotificationTemplates();  // Add this line
  }
fetchNotificationTemplates(): void {
  this.isLoadingTemplates = true;
  if (this.restaurantId > 0) {
    this.service.getNotificationTemplates(this.restaurantId).subscribe(
      (data: NotificationTemplate[]) => {
        this.templates = data.map(template => ({
          ...template,
          createdOn: this.convertUtcToBrowserTimezone(template.createdOn)
        }));
        this.notificationTemplatesDataSource.data = this.templates;
        this.isLoadingTemplates = false;
      },
      (error) => {
        console.error('Error fetching templates:', error);
        this.isLoadingTemplates = false;
      }
    );
  }
}

editTemplate(template: NotificationTemplate): void {
  const dialogRef = this.dialog.open(NotificationDialogComponent, {
    width: '700px',
    data: {
      template,
      type: 'edit-template',
      restaurantId: this.restaurantId
    }
  });

  dialogRef.afterClosed().subscribe(result => {
    if (result && result.updated) {
      this.snackBar.open('Template updated successfully', 'Close', {
        duration: 3000,
        panelClass: 'success-snackbar'
      });
      this.fetchNotificationTemplates();
    }
  });
}



deleteTemplate(template: NotificationTemplate): void {
  const confirmDelete = confirm(`Are you sure you want to delete the template "${template.templateName}"?`);
  
  // if (confirmDelete) {
  //   this.service.deleteNotificationTemplate(template.templateId).subscribe(
  //     () => {
  //       this.snackBar.open('Template deleted successfully', 'Close', {
  //         duration: 3000,
  //         panelClass: 'success-snackbar'
  //       });
  //       this.fetchNotificationTemplates();
  //     },
  //     (error) => {
  //       console.error('Error deleting template:', error);
  //       this.snackBar.open('Failed to delete template', 'Close', {
  //         duration: 3000,
  //         panelClass: 'error-snackbar'
  //       });
  //     }
  //   );
  // }
}

  ngAfterViewInit() {
  this.dataSource.paginator = this.paginator;
  this.dataSource.sort = this.sort;
  this.notificationHistoryDataSource.paginator = this.historyPaginator;
  this.notificationHistoryDataSource.sort = this.historySort;
  // Add this line if using templates tab:
  this.notificationTemplatesDataSource.paginator = this.templatesPaginator;
  this.notificationTemplatesDataSource.sort = this.templatesSort;
}
  ngOnDestroy(): void {
    if (this.refreshIntervalId) {
      clearInterval(this.refreshIntervalId);
    }
  }

  // ============================================
  // API FETCH METHODS
  // ============================================

fetchMembershipUsers(): void {
  this.isLoading = true;
  this.errorMessage = '';
  if (this.restaurantId > 0) {
    this.service.getMembershipUsers(this.restaurantId).subscribe(
      (data: MembershipUser[]) => {
        // Convert createdOn from UTC to browser timezone
        this.originalData = data.map(user => ({
          ...user,
          createdOn: this.convertUtcToBrowserTimezone(user.createdOn)
        }));
        
        this.dataSource.data = this.originalData;
        this.isLoading = false;
      },
      (error) => {
        console.error('Error fetching membership users:', error);
        this.errorMessage = 'Failed to load membership users. Please try again.';
        this.isLoading = false;
      }
    );
  }
}


  // FIXED: Remove the incorrect variable declaration
fetchNotificationHistory(): void {
  this.isLoadingHistory = true;
  if (this.restaurantId > 0) {
    this.service.GetNotificationHistory_Master(this.restaurantId).subscribe(
      (data: NotificationHistory[]) => {
        // Group by masterId
        const grouped = new Map<string, NotificationHistoryGroup>();

        data.forEach(record => {
          const key = record.masterId;
          if (!grouped.has(key)) {
            grouped.set(key, {
              masterId: record.masterId,
              notificationTitle: record.notificationTitle,
              notificationBody: record.notificationBody,
              sentOn: this.convertUtcToBrowserTimezone(record.sentOn),
              
              sentTo:record.sentTo,
              createdBy: record.createdBy,
              recipientCount: 0,
              children: [],
              isExpanded: false
            });
          }
          const group = grouped.get(key)!;
          group.children.push(record);
          group.recipientCount++;
        });

        this.notificationHistoryGroups = Array.from(grouped.values())
          .sort((a, b) => new Date(b.sentOn).getTime() - new Date(a.sentOn).getTime());

        this.isLoadingHistory = false;
      },
      (error) => {
        console.error('Error fetching notification history:', error);
        this.isLoadingHistory = false;
      }
    );
  }
}
historyFilterValue: string = '';

applyHistoryFilter(event: Event): void {
  this.historyFilterValue = (event.target as HTMLInputElement).value.trim().toLowerCase();
}

get filteredHistoryGroups(): NotificationHistoryGroup[] {
  if (!this.historyFilterValue) return this.notificationHistoryGroups;
  return this.notificationHistoryGroups.filter(g =>
    g.notificationTitle.toLowerCase().includes(this.historyFilterValue) ||
    g.notificationBody.toLowerCase().includes(this.historyFilterValue)
  );
}
// ADD this toggle method:
toggleGroup(group: NotificationHistoryGroup): void {
  group.isExpanded = !group.isExpanded;
}
  // ============================================
  // NEW: FETCH MEMBER NOTIFICATIONS
  // ============================================
  fetchMemberNotifications(member: MembershipUser): void {
    this.selectedMember = member;
    this.isLoadingMemberNotifications = true;

    if (this.restaurantId > 0) {
      this.service.getNotificationHistory(this.restaurantId, member.deviceToken).subscribe(
        (response) => {
          this.openMemberNotificationsDialog(response,member);
          this.isLoadingMemberNotifications = false;
        },
        (error) => {
          console.error('Error fetching member notifications:', error);
          this.snackBar.open('Failed to load member notifications', 'Close', {
            duration: 3000,
            panelClass: 'error-snackbar'
          });
          this.isLoadingMemberNotifications = false;
        }
      );
    }
  }

  // ============================================
  // NEW: OPEN MEMBER NOTIFICATIONS DIALOG
  // ============================================
  openMemberNotificationsDialog(response: NotificationHistory[],member:any): void {
    const dialogRef = this.dialog.open(NotificationHistoryDialogComponent, {
      width: '920px',
      height: '800px',
      maxWidth: '98vw',
      maxHeight: '98vh',
      data: {
      //  memberNotifications: response,
          memberInfo: member,
      notifications: response
        //type: 'member-notifications'
      }
    });
  }

  // ============================================
  // NEW: VIEW MEMBER NOTIFICATIONS (BUTTON CLICK)
  // ============================================
  viewMemberNotifications(user: MembershipUser): void {
    this.fetchMemberNotifications(user);
  }

  // ============================================
  // FILTER METHODS
  // ============================================

  customFilterPredicate() {
    return (data: MembershipUser, filter: string): boolean => {
      if (!filter) return true;
      const filterValue = filter.trim().toLowerCase();
      return data.firstName.toLowerCase().includes(filterValue) ||
        data.lastName.toLowerCase().includes(filterValue) ||
        data.createdOn.toLowerCase().includes(filterValue);
    };
  }

  customHistoryFilterPredicate() {
    return (data: NotificationHistory, filter: string): boolean => {
      if (!filter) return true;
      const filterValue = filter.trim().toLowerCase();
      return data.notificationTitle.toLowerCase().includes(filterValue) ||
        data.notificationBody.toLowerCase().includes(filterValue);
    };
  }

  applyFilter(event: Event): void {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();
    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  // applyHistoryFilter(event: Event): void {
  //   const filterValue = (event.target as HTMLInputElement).value;
  //   this.notificationHistoryDataSource.filter = filterValue.trim().toLowerCase();
  //   if (this.notificationHistoryDataSource.paginator) {
  //     this.notificationHistoryDataSource.paginator.firstPage();
  //   }
  // }

  // ============================================
  // SELECTION METHODS
  // ============================================

  isAllSelected(): boolean {
    const numSelected = this.selection.selected.length;
    const numRows = this.dataSource.data.length;
    return numSelected === numRows;
  }

  deselectAll(): void {
    this.selection.clear();
  }

  toggleAllRows(): void {
    if (this.isAllSelected()) {
      this.selection.clear();
      return;
    }
    this.selection.select(...this.dataSource.data);
  }

  checkboxLabel(row?: MembershipUser): string {
    if (!row) {
      return `${this.isAllSelected() ? 'deselect' : 'select'} all`;
    }
    return `${this.selection.isSelected(row) ? 'deselect' : 'select'} row ${row.membershipCode}`;
  }

  // ============================================
  // DIALOG METHODS
  // ============================================

  viewUserDetails(user: MembershipUser): void {
    const dialogRef = this.dialog.open(NotificationDialogComponent, {
      width: '90vw',
      height: '85vh',
      data: { user, type: 'details' }
    });
  }

  viewNotificationDetails(notification: NotificationHistory): void {
    const dialogRef = this.dialog.open(NotificationHistoryDialogComponent, {
      width: '600px',
      data: { notification, type: 'history-details' }
    });
  }

  // ============================================
  // NOTIFICATION METHODS
  // ============================================

  sendNotification(user?: MembershipUser): void {
    const selectedUsers = user ? [user] : this.selection.selected;
    
    if (selectedUsers.length === 0) {
      this.snackBar.open('Please select at least one user', 'Close', {
        duration: 3000,
        panelClass: 'error-snackbar'
      });
      return;
    }
    this.openBulkNotificationDialog(selectedUsers);
  }

 openNotificationDialog(user: MembershipUser): void {
  const dialogRef = this.dialog.open(NotificationDialogComponent, {
    width: '700px',
    maxWidth: '95vw',
    data: {
      user,
      type: 'notification',
      restaurantId: this.restaurantId,
      templates: this.templates  // Add this line
    }
  });

  dialogRef.afterClosed().subscribe(result => {
    if (result && result.title && result.body) {
      this.sendSingleNotification(user.membershipCode, result.title, result.body);

    }
    this.fetchNotificationTemplates();
  });
}
  openBulkNotificationDialog(users: MembershipUser[]): void {
  const dialogRef = this.dialog.open(NotificationDialogComponent, {
    width: '700px',
    maxWidth: '95vw',
    data: {
      users,
      type: 'bulk-notification',
      restaurantId: this.restaurantId,
      templates: this.templates  // Add this line
    }
  });

  dialogRef.afterClosed().subscribe(result => {
    if (result && result.title && result.body) {
      this.sendBulkNotification(users.map(u => u.membershipCode), result.title, result.body);
      
    }
    this.fetchNotificationTemplates();
  });
}
  sendSingleNotification(membershipCode: string, title: string, body: string): void {
    this.isLoading = true;
    // Uncomment when API is ready
    // this.service.sendNotification(membershipCode, title, body).subscribe(...)
  }
applyTemplatesFilter(event: Event): void {
  const filterValue = (event.target as HTMLInputElement).value;
  this.notificationTemplatesDataSource.filter = filterValue.trim().toLowerCase();
  if (this.notificationTemplatesDataSource.paginator) {
    this.notificationTemplatesDataSource.paginator.firstPage();
  }
}

customTemplatesFilterPredicate() {
  return (data: NotificationTemplate, filter: string): boolean => {
    if (!filter) return true;
    const filterValue = filter.trim().toLowerCase();
    return data.templateName.toLowerCase().includes(filterValue) ||
      data.notificationTitle.toLowerCase().includes(filterValue) ||
      data.notificationBody.toLowerCase().includes(filterValue);
  };
}

  sendBulkNotification(membershipCodes: string[], title: string, body: string): void {
    const membershipCodeCSV = membershipCodes.join(',');
    this.isLoading = true;

    this.service.sendBulkNotification(this.restaurantId, membershipCodeCSV, title, body).subscribe(
      (response) => {
        this.snackBar.open('Notifications sent successfully', 'Close', {
          duration: 3000,
          panelClass: 'success-snackbar'
        });
        this.deselectAll();
        this.isLoading = false;
        this.fetchNotificationHistory();
      },
      (error) => {
        console.error('Error sending bulk notifications:', error);
        this.snackBar.open('Failed to send notifications', 'Close', {
          duration: 3000,
          panelClass: 'error-snackbar'
        });
        this.isLoading = false;
      }
    );
  }

  // ============================================
  // UTILITY METHODS
  // ============================================

  getStatusBadgeClass(status: string): string {
    switch (status) {
      case 'delivered':
        return 'status-badge-success';
      case 'read':
        return 'status-badge-info';
      case 'failed':
        return 'status-badge-failed';
      case 'pending':
        return 'status-badge-pending';
      default:
        return 'status-badge-pending';
    }
  }

  goHome() {
    this.router.navigate(['dashboard']);
  }

  getRowColor(user: MembershipUser): string {
    if (user.totalVisits > 10) return '#e8f5e9';
    if (user.totalVisits > 5) return '#fff3e0';
    return '#ffebee';
  }
}