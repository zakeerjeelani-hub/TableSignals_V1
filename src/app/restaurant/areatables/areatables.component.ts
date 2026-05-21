import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { AbstractControl, FormArray, FormBuilder, FormGroup, ReactiveFormsModule, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { LeftMenuComponent } from '../../layout/left-menu/left-menu.component';
import { TopMenuComponent } from '../../layout/top-menu/top-menu.component';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { TSArea } from '../../models/TSArea';
import { RestaurantService } from '../../Services/restaurant.service';
import { forkJoin } from 'rxjs';
import { MatIcon } from '@angular/material/icon';
import { Router } from '@angular/router';
import { BackButtonComponent } from '../../common/back-button/back-button.component';
import { SessionService } from '../../Services/session.service';

@Component({
  selector: 'app-areatables',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    LeftMenuComponent,
    TopMenuComponent,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    MatButtonModule,
    MatIcon,
    BackButtonComponent
  ],
  templateUrl: './areatables.component.html',
  styleUrls: ['./areatables.component.scss']
})
export class AreatablesComponent implements OnInit {
  form: FormGroup;
  numbers: number[] = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10,11, 12, 13, 14, 15, 16, 17, 18, 19,20]; // Number of options in the dropdown
  disabledNumbers: Set<number> = new Set(); // Store disabled options based on the number of tables
  sidenavVisible: boolean = true;
  restaurantId!: number;
  isSaving: any;
  areas: TSArea[] = []; // Store areas here
  savedTables: any[] = []; // Store saved tables here
  
  constructor(
    private router: Router,
    private service: RestaurantService,
    private cdr: ChangeDetectorRef,
    private fb: FormBuilder,
    private http: HttpClient,
    private session: SessionService
  ) {
    this.restaurantId = this.session.getNumber('restaurantId');
    if (this.restaurantId === 0) {
      this.router.navigate(['login']);
    }

    this.form = this.fb.group({
      areaSelect: ['', Validators.required], // Dropdown to select an area
      numberSelect: [null, Validators.required], // Dropdown to select the number of tables
      tables: this.fb.array([])  // Array for dynamic table (textboxes)
    });
  }
  goHome(){this.router.navigate(['dashboard']);}
  ngOnInit(): void {
    this.loadAreasFromApi();
  }

  loadAreasFromApi() {
    this.service.TSRestaurantAreas(this.restaurantId).subscribe((areas: TSArea[]) => {
      this.areas = areas.sort((a, b) => {
        // Extract numbers from table names if they exist
        const aMatch = a.areaName.match(/(\D+)(\d+)/);
        const bMatch = b.areaName.match(/(\D+)(\d+)/);
        
        // If both have the same text pattern with numbers
        if (aMatch && bMatch && aMatch[1] === bMatch[1]) {
          // Compare the numeric parts
          return parseInt(aMatch[2]) - parseInt(bMatch[2]);
        }
        
        // Otherwise do regular string comparison
        return a.areaName.localeCompare(b.areaName);
      });
    });
  }

  // Helper to get the tables form array
  get tables(): FormArray {
    return this.form.get('tables') as FormArray;
  }

  // Create a table group
 // Update the createTableGroup method to include duplicate validation
createTableGroup(tableName: string = '', tableId: number = 0): FormGroup {
  return this.fb.group({
    tableId: [tableId],
    tableName: [tableName, [Validators.required, this.tableNameValidator()]]
  });
}

// Add this custom validator
tableNameValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    if (!control.value) return null;
    
    const currentValue = control.value.trim().toLowerCase();
    
    // Skip validation if no value
    if (!currentValue) return null;
    
    // Check if this table name exists in other controls
    const tableControls = this.tables?.controls || [];
    const duplicateFound = tableControls.some((formGroup: AbstractControl, index: number) => {
      const otherControl = formGroup.get('tableName');
      return otherControl && 
             otherControl !== control && 
             otherControl.value &&
             otherControl.value.trim().toLowerCase() === currentValue;
    });
    
    return duplicateFound ? { 'duplicate': true } : null;
  };
}

  // Add a new table
  addTable() {
    this.isSaving=false;  
    const nextTableNumber = this.tables.length + 1;
    this.tables.push(this.createTableGroup('Table ' + nextTableNumber.toString(), 0));
    
    // Disable the current number in the dropdown
    this.form.get('numberSelect')?.setValue(this.tables.length);
    this.disableNumbers();
  }

  // Remove a table by index
  removeTable(index: number) {
    const confirmation = confirm('Are you sure you want to delete this table?');
    if (confirmation) {
    const tableToRemove = this.tables.at(index).value;
    const tableId = tableToRemove.tableId; // Get the tableId to pass to the API

    // Only call the remove API if the tableId is not 0 (i.e., it's an existing table)
    if (tableId !== 0) {
      this.service.TSTableDelete(tableId).subscribe(
        (response) => {
          console.log('Table removed successfully from the server', response);

          // Remove the table from the form array
          this.tables.removeAt(index);

          // Update the numberSelect dropdown to reflect the new number of tables
          this.form.get('numberSelect')?.setValue(this.tables.length);

          // Re-enable the deleted number
          this.disableNumbers();
        },
        (error) => {
          console.error('Error removing table from the server:', error);
          alert('Failed to remove table from the server.');
        }
      );
    } else {
      // If tableId is 0, it's a newly added table and hasn't been saved to the server yet
      // Just remove it from the form
      this.tables.removeAt(index);

      // Update the numberSelect dropdown to reflect the new number of tables
      this.form.get('numberSelect')?.setValue(this.tables.length);

      // Re-enable the deleted number
      this.disableNumbers();
    }
  }
  }
  // Method to handle when an area is selected
  onAreaChange(event: any) {
    const areaId = event.value;
    if (areaId) {
      this.form.get('numberSelect')?.enable(); // Enable numberSelect dropdown after area is selected
      this.loadSavedTables(areaId); // Load saved tables for the selected area
    } else {
      this.form.get('numberSelect')?.disable(); // Disable numberSelect if no valid area is selected
      this.tables.clear(); // Clear existing tables
    }
  }

  loadSavedTables(areaId: number) {
    this.service.TSRestaurantTables(areaId).subscribe(
      (tables: any[]) => {
        this.tables.clear(); // Clear existing form array
        if (tables && tables.length > 0) {
          this.savedTables = tables.sort((a, b) => {
            // Extract numbers from table names if they exist
            const aMatch = a.tableName.match(/(\D+)(\d+)/);
            const bMatch = b.tableName.match(/(\D+)(\d+)/);
            
            // If both have the same text pattern with numbers
            if (aMatch && bMatch && aMatch[1] === bMatch[1]) {
              // Compare the numeric parts
              return parseInt(aMatch[2]) - parseInt(bMatch[2]);
            }
            
            // Otherwise do regular string comparison
            return a.tableName.localeCompare(b.tableName);
          });
          this.updateTableForm(tables);
        } else {
          this.form.get('numberSelect')?.setValue(0);
        }
        this.disableNumbers(); // Disable numbers based on the number of tables
      },
      (error) => {
        console.error('Error loading tables:', error);
      }
    );
  }

  // Populate the form with saved tables
  updateTableForm(tables: any[]) {
    this.tables.clear(); // Clear existing form array
    tables.forEach(table => {
      this.tables.push(this.createTableGroup(table.tableName, table.tableId)); // Add saved tables to the form
    });
    this.form.get('numberSelect')?.setValue(tables.length); // Set the numberSelect based on saved tables
    this.disableNumbers(); // Disable numbers based on the number of tables
  }

  // Disable numbers in the dropdown based on the number of created tables
  disableNumbers() {
    const currentCount = this.tables.length;
    this.disabledNumbers.clear(); // Clear previous disabled numbers
    this.numbers.forEach(number => {
      if (number <= currentCount) {
        this.disabledNumbers.add(number);
      }
    });
  }

  // When the number of tables is changed
  onNumberChange(event: any) {
    const count = event.value;
    this.updateTables(count);
  }

  // Update the number of tables dynamically
  updateTables(count: number) {
    while (this.tables.length > count) {
      this.tables.removeAt(this.tables.length - 1);
    }
    while (this.tables.length < count) {
      this.tables.push(this.createTableGroup('Table ' + (this.tables.length + 1).toString(), 0));
    }
    this.disableNumbers(); // Disable numbers based on the new number of tables
  }
// Add this method to your component class
checkDuplicateTableNames(): boolean {
  const tableNames = this.tables.controls.map(control => 
    control.get('tableName')?.value.trim().toLowerCase());
  
  // Check for duplicates using Set
  return tableNames.length !== new Set(tableNames).size;
}
  saveTables() {
    if (this.isSaving) return; // Prevent multiple clicks
        // this.isSaving = true; // Disable button

    if (this.isSaving) return; // Prevent multiple clicks
  
    // Check for duplicate table names
    if (this.checkDuplicateTableNames()) {
      alert('Error: Duplicate table names are not allowed within the same area.');
      return;
    }

    if (this.form.valid) {
      
  
      // Collect all tables data from the form
      const tables = this.form.value.tables.map((value: any) => ({
        tableId: value.tableId || 0, // Set tableId to 0 for new records
        areaId: this.form.value.areaSelect, // Associate table with selected area
        tableName: value['tableName'],
        tableDesc: value['tableName'] // Assuming the description is the same as the table name
      }));
  
      // Send the entire list of tables to the backend in a single request
      this.service.saveAllTables(tables).subscribe(
        (response) => {
          console.log('Tables saved or updated:', response);
      
          alert('Tables saved successfully!');
          this.isSaving = false; // Enable button after success
          this.loadSavedTables(this.form.value.areaSelect)
        },
        (error) => {
          console.error('Error saving tables:', error);
      
          alert('Failed to save tables!');
          
          this.loadSavedTables(this.form.value.areaSelect); // Load saved tables for the selected area
          this.isSaving = false; // Enable button after success
        }
      );
    }
  }
  
  GoToQR() {
    this.router.navigate(['/qrgenerator']);
  }
}
