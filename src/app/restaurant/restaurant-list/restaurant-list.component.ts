import { AfterViewInit, ChangeDetectorRef, Component, Inject, OnInit, PLATFORM_ID, ViewChild } from '@angular/core';
import { MatCell, MatColumnDef, MatHeaderCellDef, MatHeaderRowDef, MatRowDef, MatTable, MatTableDataSource, MatTableModule } from '@angular/material/table';
import { RestaurantService } from '../../Services/restaurant.service';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { MatFormField, MatFormFieldControl, MatFormFieldModule, MatLabel } from '@angular/material/form-field';
import { FormBuilder, FormsModule } from '@angular/forms';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatInputModule } from '@angular/material/input';
import { LeftMenuComponent } from '../../layout/left-menu/left-menu.component';
import { TopMenuComponent } from '../../layout/top-menu/top-menu.component';

@Component({
  selector: 'app-restaurant-list',
  standalone: true,
  imports: [CommonModule,MatTable,MatHeaderCellDef,MatColumnDef,MatCell,MatRowDef,MatHeaderRowDef,MatFormFieldModule,
    CommonModule,
    FormsModule,
    MatTableModule,
    MatSortModule,
    MatFormFieldModule,
    MatInputModule,
    MatSortModule,
    LeftMenuComponent,
        TopMenuComponent,
  ],
  templateUrl: './restaurant-list.component.html',
  styleUrl: './restaurant-list.component.scss'
})
export class RestaurantListComponent implements OnInit,AfterViewInit  {
  displayedColumns: string[] = ['restaurantName', 'email', 'city', 'createdOn'];
  dataSource = new MatTableDataSource<Restaurant>([]);
  filteredData: Restaurant[] = [];
  @ViewChild(MatSort) sort!: MatSort; 
  constructor(private restaurantService: RestaurantService ,
      @Inject(PLATFORM_ID) private platformId: Object,
      private service: RestaurantService,
      private cdr: ChangeDetectorRef,
      private fb: FormBuilder
    ) {
      
    }

  ngAfterViewInit() {
    this.dataSource.sort = this.sort; // Ensure Sorting is Applied After View Init
  }
  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      this.loadRestaurants();
    }
  }

  loadRestaurants() {
    this.restaurantService.getAllRestaurants().subscribe(
      (data: Restaurant[]) => {
        this.dataSource = new MatTableDataSource(data);
        this.dataSource.sort = this.sort; // Attach Sorting Here
      },
      error => console.error('Error fetching restaurants:', error)
    );
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value.trim().toLowerCase();
    this.filteredData = this.dataSource.data.filter(restaurant =>
      restaurant.restaurantName.toLowerCase().includes(filterValue) ||
      restaurant.emailID.toLowerCase().includes(filterValue) ||
      restaurant.city.toLowerCase().includes(filterValue)
    );
  }
}

interface Restaurant {
  restaurantName: string;
  emailID: string;
  city: string;
  createdOn: string;

}
