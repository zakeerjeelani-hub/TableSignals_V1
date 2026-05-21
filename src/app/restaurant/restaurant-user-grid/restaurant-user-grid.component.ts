import { Component, OnInit, ViewChild, AfterViewInit, TemplateRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RestaurantService } from '../../Services/restaurant.service'; // Adjust path as needed

// Angular Material Imports
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatPaginatorModule, MatPaginator } from '@angular/material/paginator';
import { MatSortModule, MatSort } from '@angular/material/sort';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatDialogModule, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatSelectModule } from '@angular/material/select';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TSRestaurantProfileUser, TSRestaurantProfileUser_V1 } from '../../models/TSRestaurantProfileUser';
import { TopMenuComponent } from '../../layout/top-menu/top-menu.component';
import { LeftMenuComponent } from '../../layout/left-menu/left-menu.component';
import { SuccessMessageComponent } from '../../common/success-message/success-message.component';
import { Router } from '@angular/router';
import { BackButtonComponent } from '../../common/back-button/back-button.component';
import { SessionService } from '../../Services/session.service';

// Entity Interface

@Component({
  selector: 'app-restaurant-user-grid',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatDialogModule,
    MatSnackBarModule,
    MatSelectModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    // TopMenuComponent,
    // LeftMenuComponent,
   // SuccessMessageComponent,
    BackButtonComponent
  ],
  templateUrl: './restaurant-user-grid.component.html',
  styleUrl: './restaurant-user-grid.component.scss'
})
export class RestaurantUserGridComponent implements OnInit, AfterViewInit {
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;
  @ViewChild('userDialogTemplate') userDialogTemplate!: TemplateRef<any>;
statusSuccess: boolean = false;
  
  displayedColumns: string[] = [
    
    'userName', 
    'firstName', 
    'lastName', 
    'emailID',
    'phoneNo',
    'isServiceEnabled',

    'roleName',
    'actions'
  ];

  dataSource = new MatTableDataSource<TSRestaurantProfileUser_V1>();
  isLoading = false;
  isEditing = false;
  editingUser: TSRestaurantProfileUser_V1 | null = null;
  dialogRef: MatDialogRef<any> | null = null;

  sidenavVisible: boolean = true;
  // Available roles for dropdown
availableRoles = [
  { roleId: 1, roleName: 'Admin' },
  { roleId: 2, roleName: 'Manager' },
  { roleId: 3, roleName: 'User' }
];
  // Form data for add/edit
  userForm: TSRestaurantProfileUser_V1 = {
    restaurantId: 0,
    emailID: '',
    userName: '',
    firstName: '',
    lastName: '',
    password: '',
    phoneNo: '',
    address: '',
    mode: 'Active',
    roleID: 0,
    userId: 0,
    roleName: '',
    isServiceEnabled:true
  };

  // Sample data - replace with actual service calls
restaurantId!: number;

   goHome(){this.router.navigate(['dashboard']);}  
constructor(
      private router: Router,
    private snackBar: MatSnackBar,
    private dialog: MatDialog,
    private restaurantService: RestaurantService,
    private session: SessionService
  ) {
    this.restaurantId = this.session.getNumber('restaurantId');
    this.userForm.restaurantId = this.restaurantId;
    if (this.restaurantId === 0) {
      this.router.navigate(['login']);
    } else {
      this.loadUsers();
    }
  }

  ngOnInit(): void {
        this.userForm.restaurantId=this.restaurantId;    
  }
 toggleSidenav(): void {
    this.sidenavVisible = !this.sidenavVisible; // Toggle the visibility
  }
  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  loadUsers(): void {
    this.isLoading = true;
    this.restaurantService.getRestaurantUsersByRestaurantId_V1(this.restaurantId).subscribe({
      next: (users: TSRestaurantProfileUser_V1[]) => {
            this.dataSource.data = users;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading users:', error);
        this.showSnackBar('Failed to load users. Please try again.');
        this.isLoading = false;
        // Fallback to sample data for development
       // this.dataSource.data = this.sampleUsers;
      }
    });
  }

  applyFilter(event: Event): void {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();

    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  openAddUserDialog(): void {
    this.isEditing = false;
    this.editingUser = null;
    this.resetForm();
    this.openDialog();
  }
// Handle role selection change
onRoleChange(event: any): void {
  const selectedRoleId = event.value;
  const selectedRole = this.availableRoles.find(r => r.roleId === selectedRoleId);
  
  if (selectedRole) {
    this.userForm.roleID = selectedRole.roleId;
    this.userForm.roleName = selectedRole.roleName;
    console.log('Role changed:', { roleID: this.userForm.roleID, roleName: this.userForm.roleName });
  }
}
  openEditUserDialog(user: TSRestaurantProfileUser_V1): void {
  this.isEditing = true;
  this.editingUser = { ...user };
  this.userForm = { ...user };
  
  // Ensure roleID is set correctly for the dropdown
  if (this.userForm.roleName && !this.userForm.roleID) {
    const role = this.availableRoles.find(r => r.roleName === this.userForm.roleName);
    if (role) {
      this.userForm.roleID = role.roleId;
    }
  }
  
  this.openDialog();
}
  private openDialog(): void {
    this.dialogRef = this.dialog.open(this.userDialogTemplate, {
      width: '800px',
      maxWidth: '90vw',
      maxHeight: '90vh',
      disableClose: false,
      autoFocus: true,
      panelClass: 'user-dialog-panel'
    });

    this.dialogRef.afterClosed().subscribe(() => {
      this.resetForm();
      this.isEditing = false;
      this.editingUser = null;
    });
  }

  closeDialog(): void {
    if (this.dialogRef) {
      this.dialogRef.close();
    }
  }

  deleteUser(user: TSRestaurantProfileUser_V1): void {
    if (confirm(`Are you sure you want to delete user "${user.userName}"?`)) {
      this.isLoading = true;
      
      this.restaurantService.deleteRestaurantUser(user.userId).subscribe({
        next: () => {
                // Remove user from local data source
          const updatedData = this.dataSource.data.filter(u => u.userId !== user.userId);
          this.dataSource.data = updatedData;
          
          this.showSnackBar(`User "${user.userName}" deleted successfully`);
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error deleting user:', error);
          this.showSnackBar('Failed to delete user. Please try again.');
          this.isLoading = false;
        }
      });
    }
  }

  saveUser(): void {
    if (!this.validateForm()) {
      return;
    }

    this.isLoading = true;

    if (this.isEditing && this.editingUser) {
      // Update existing user
      this.restaurantService.updateRestaurantUser_V1(this.userForm.userId, this.userForm).subscribe({
        next: (updatedUser: TSRestaurantProfileUser_V1) => {
          this.showSnackBar('User updated successfully');
          this.closeDialog();
          this.loadUsers();
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error updating user:', error);
          this.showSnackBar('Failed to update user. Please try again.');
          this.isLoading = false;
        }
      });
    } else {
      // Add new user
        this.userForm.restaurantId=this.restaurantId;
      this.restaurantService.createRestaurantUser_V1(this.userForm).subscribe({
        next: (newUser: TSRestaurantProfileUser_V1) => {
          this.loadUsers();
          this.isLoading = false;
          this.showSnackBar('User added successfully');
          this.closeDialog();
          this.isLoading = false;
        },
        error: (err) => {
                console.error('Error creating user:', err);
          this.showSnackBar(err.error.message);
          this.isLoading = false;
        }
      });
    }
  }

  private resetForm(): void {
    this.userForm = {
      restaurantId: 0,
      emailID: '',
      userName: '',
      firstName: '',
      lastName: '',
      password: '',
      phoneNo: '',
      address: '',
      mode: '',
      roleID: 3,
      userId: 0,
      roleName: 'User',
      isServiceEnabled:false
    };
  }

  private validateForm(): boolean {
  if (!this.userForm.userName.trim()) {
    this.showSnackBar('Username is required');
    return false;
  }
  if (!this.userForm.emailID.trim()) {
    this.showSnackBar('Email is required');
    return false;
  }
  if (!this.userForm.roleID || this.userForm.roleID === 0) {
    this.showSnackBar('Role is required');
    return false;
  }
  if (!this.isEditing && !this.userForm.password.trim()) {
    this.showSnackBar('Password is required for new users');
    return false;
  }
  return true;
}

  private showSnackBar(message: string): void {
    this.snackBar.open(message, 'Close', {
      duration: 3000,
      horizontalPosition: 'right',
      verticalPosition: 'top'
    });
  }

  getRoleChipColor(role: string): string {
    switch (role) {
      case 'Admin':
        return 'warn';
      case 'Manager':
        return 'primary';
      case 'User':
        return 'accent';
      default:
        return 'accent';
    }
  }

  enabledisableservice(user: any): void {
  // Toggle the service status
  const newStatus = !user.isServiceEnabled;
  
  // Show loading state if needed
  this.isLoading = true;
  
  // Call your service method
  this.restaurantService.EnableDisableRestaurantUserService(user.userId, newStatus).subscribe({
    next: (response) => {
      // Update the local data
      user.isServiceEnabled = newStatus;
      
      // Refresh the data source to trigger change detection
      this.dataSource.data = [...this.dataSource.data];
      
      // Show success message
      this.showSuccessMessage(`Service ${newStatus ? 'enabled' : 'disabled'} successfully`);
      this.isLoading = false;
    },
    error: (error) => {
      console.error('Error updating service status:', error);
      this.showErrorMessage('Failed to update service status');
      this.isLoading = false;
    }
  });
}

// Helper methods for notifications
private showSuccessMessage(message: string): void {
  // Using MatSnackBar (make sure to inject it in constructor)
  this.snackBar.open(message, 'Close', {
    duration: 3000,
    panelClass: ['success-snackbar']
  });
}

private showErrorMessage(message: string): void {
  this.snackBar.open(message, 'Close', {
    duration: 5000,
    panelClass: ['error-snackbar']
  });
}

trackByRoleId(_: number, role: { roleId: number }): number { return role.roleId; }
}