import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { AbstractControl, FormArray, FormBuilder, FormGroup, ReactiveFormsModule, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { TSArea } from '../../models/TSArea';
import { RestaurantService } from '../../Services/restaurant.service';
import { MatIconModule } from '@angular/material/icon';
import { Router } from '@angular/router';
import { BackButtonComponent } from '../../common/back-button/back-button.component';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTableModule } from '@angular/material/table';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatTooltipModule } from '@angular/material/tooltip';
import { SessionService } from '../../Services/session.service';

@Component({
  selector: 'app-areatables',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    BackButtonComponent,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatTableModule,
    MatCheckboxModule,
    MatTooltipModule
  ],
  templateUrl: './areatables1.component.html',
  styleUrls: ['./areatables1.component.scss']
})
export class Areatables1Component implements OnInit {
  form: FormGroup;
  numbers: number[] = Array.from({ length: 20 }, (_, i) => i + 1);
  disabledNumbers: Set<number> = new Set();
  sidenavVisible: boolean = true;
  restaurantId!: number;
  isSaving = false;
  isLoading = false;
  isEditMode = false;
  areas: TSArea[] = [];
  savedTables: any[] = [];
  selectedAreaId: number | null = null;

  // NEW: Store tables from all areas for cross-area validation
  allLoadedTables: Map<number, any[]> = new Map();

  constructor(
    private router: Router,
    private service: RestaurantService,
    private cdr: ChangeDetectorRef,
    private fb: FormBuilder,
    private http: HttpClient,
    private snackBar: MatSnackBar,
    private session: SessionService
  ) {
    this.restaurantId = this.session.getNumber('restaurantId');
    if (this.restaurantId === 0) {
      this.router.navigate(['login']);
    }

    this.form = this.fb.group({
      areaSelect: ['', Validators.required],
      tables: this.fb.array([])
    });
  }

  goHome(): void {
    this.router.navigate(['dashboard']);
  }

  ngOnInit(): void {
    this.loadAreasFromApi();
  }

  // UPDATED: Load areas and then load tables for all areas
  loadAreasFromApi(): void {
    this.isLoading = true;
    this.service.TSRestaurantAreas(this.restaurantId).subscribe({
      next: (areas: TSArea[]) => {
        this.areas = this.sortAreas(areas);
        
        // Load tables for all areas
        this.loadTablesForAllAreas(areas);
      },
      error: (error) => {
        console.error('Error loading areas:', error);
        this.showError('Failed to load areas');
        this.isLoading = false;
      }
    });
  }

  // NEW: Load tables for all areas in parallel
  private loadTablesForAllAreas(areas: TSArea[]): void {
    if (areas.length === 0) {
      this.isLoading = false;
      return;
    }

    let completed = 0;

    areas.forEach(area => {
      this.service.TSRestaurantTables(area.areaId).subscribe({
        next: (tables: any[]) => {
          this.allLoadedTables.set(area.areaId, tables || []);
          completed++;

          if (completed === areas.length) {
            this.isLoading = false;
            this.cdr.detectChanges();
          }
        },
        error: (error) => {
          console.error(`Error loading tables for area ${area.areaId}:`, error);
          this.allLoadedTables.set(area.areaId, []);
          completed++;

          if (completed === areas.length) {
            this.isLoading = false;
            this.cdr.detectChanges();
          }
        }
      });
    });
  }

  private sortAreas(areas: TSArea[]): TSArea[] {
    return areas.sort((a, b) => {
      const aMatch = a.areaName.match(/(\D+)(\d+)/);
      const bMatch = b.areaName.match(/(\D+)(\d+)/);
      
      if (aMatch && bMatch && aMatch[1] === bMatch[1]) {
        return parseInt(aMatch[2]) - parseInt(bMatch[2]);
      }
      
      return a.areaName.localeCompare(b.areaName);
    });
  }

  get tables(): FormArray {
    return this.form.get('tables') as FormArray;
  }

  // NEW: Custom validator for duplicate table numbers (real-time validation)
  duplicateTableNumberValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      // control is the tableNo FormControl itself
      const tableNo = control.value;
      
      if (!tableNo) return null;

      // Get parent FormGroup (the table object in the array)
      const parentGroup = control.parent as FormGroup;
      if (!parentGroup) return null;

      const currentTableId = parentGroup.get('tableId')?.value;

      // Get the FormArray (tables)
      const tablesArray = parentGroup.parent as FormArray;
      if (!tablesArray) return null;

      // Find current index in the array
      const currentIndex = tablesArray.controls.indexOf(parentGroup);

      // Check within current area first - compare with other tables in this area
      const otherTablesInArea = tablesArray.controls
        .map((formGroup, index) => {
          if (index !== currentIndex) {
            return formGroup.get('tableNo')?.value;
          }
          return null;
        })
        .filter(num => num); // Filter out nulls

      if (otherTablesInArea.includes(tableNo)) {
        return { 'duplicateInArea': { value: tableNo } };
      }

      // Check against all OTHER areas (but allow editing existing tables)
      if (currentTableId === 0) { // Only block new tables
        for (const [areaId, areaTables] of this.allLoadedTables.entries()) {
          if (areaId !== this.selectedAreaId) {
            const foundTable = areaTables.find(t => t.tableNo === tableNo);
            if (foundTable) {
              // Get the area name from the areas list
              const areaName = this.areas.find(a => a.areaId === areaId)?.areaName || `Area ${areaId}`;
              return { 
                'duplicateAcrossAreas': { 
                  value: tableNo, 
                  area: areaName
                } 
              };
            }
          }
        }
      }

      return null;
    };
  }

  // UPDATED: createTableGroup with duplicate validator
  createTableGroup(tableName: string = '', tableNo: number = 0, tableId: number = 0): FormGroup {
    const group = this.fb.group({
      tableId: [tableId],
      tableNo: [
        tableNo, 
        [
          Validators.required, 
          Validators.min(1),
          this.duplicateTableNumberValidator() // Add validator
        ]
      ],
      tableName: [tableName, Validators.required]
    });

    // When tableNo changes, validate it
    const tableNoControl = group.get('tableNo');
    if (tableNoControl) {
      tableNoControl.valueChanges.subscribe(() => {
        // Update validity to trigger error messages
        tableNoControl.updateValueAndValidity({ emitEvent: false });
        
        // For new tables, reset tableId when number changes
        if (tableId === 0) {
          group.get('tableId')?.setValue(0, { emitEvent: false });
        }
      });
    }

    return group;
  }

  onAreaChange(event: any): void {
    const areaId = event.value;
    this.selectedAreaId = areaId || null;
    this.isEditMode = false;
    
    if (areaId) {
      this.loadSavedTables(areaId);
    } else {
      this.tables.clear();
    }
  }

  loadSavedTables(areaId: number): void {
    this.isLoading = true;
    
    // Get tables from allLoadedTables instead of API call
    const tables = this.allLoadedTables.get(areaId) || [];
    this.tables.clear();
    
    if (tables && tables.length > 0) {
      this.savedTables = this.sortTables(tables);
      this.updateTableForm(this.savedTables);
    }
    
    this.isLoading = false;
  }

 private sortTables(tables: any[]): any[] {
  return tables.sort((a, b) => {
    // Primary sort: by tableNo as a NUMBER
    const noA = Number(a.tableNo) || 0;
    const noB = Number(b.tableNo) || 0;
    
    if (noA !== noB) {
      return noA - noB;
    }
    
    // Secondary sort: by tableName if tableNo is the same
    return a.tableName.localeCompare(b.tableName);
  });
}

  updateTableForm(tables: any[]): void {
    this.tables.clear();
    tables.forEach((table) => {
      this.tables.push(this.createTableGroup(table.tableName, table.tableNo, table.tableId));
    });
    this.cdr.detectChanges();
  }

  toggleEditMode(): void {
    if (this.isEditMode) {
      // Cancel edit - reload tables
      this.isEditMode = false;
      this.loadSavedTables(this.selectedAreaId!);
    } else {
      // Enter edit mode
      this.isEditMode = true;
      // Mark all controls as touched to show validation errors
      this.tables.controls.forEach(control => {
        control.markAsTouched();
        control.get('tableNo')?.markAsTouched();
        control.get('tableName')?.markAsTouched();
      });
    }
  }

  addNewTable(): void {
    // Get max table number from ALL areas (not just current area)
    let maxTableNo = 0;

    // Check all loaded areas
    for (const [areaId, areaTables] of this.allLoadedTables.entries()) {
      const areaTables_copy = areaTables as any[];
      if (areaTables_copy && areaTables_copy.length > 0) {
        const areaMax = Math.max(...areaTables_copy.map(t => t.tableNo || 0));
        maxTableNo = Math.max(maxTableNo, areaMax);
      }
    }

    // Also check current form in case unsaved changes
    if (this.tables.length > 0) {
      const formMax = Math.max(...this.tables.controls.map(t => t.get('tableNo')?.value || 0));
      maxTableNo = Math.max(maxTableNo, formMax);
    }

    const nextTableNo = maxTableNo + 1;
    this.tables.push(this.createTableGroup(`Table ${nextTableNo}`, nextTableNo, 0));
  }

  removeTable(index: number): void {
    const tableId = this.tables.at(index).get('tableId')?.value;
    
    if (tableId !== 0) {
      // Existing table - delete from API first
      this.service.TSTableDelete(tableId).subscribe({
        next: () => {
          this.tables.removeAt(index);
          // Update allLoadedTables
          const currentAreaTables = this.allLoadedTables.get(this.selectedAreaId!);
          if (currentAreaTables) {
            const idx = currentAreaTables.findIndex(t => t.tableId === tableId);
            if (idx > -1) {
              currentAreaTables.splice(idx, 1);
            }
          }
          this.showSuccess('Table deleted successfully');
        },
        error: (error) => {
          console.error('Error deleting table:', error);
          this.showError('Failed to delete table');
        }
      });
    } else {
      // New table - just remove from form
      this.tables.removeAt(index);
    }
  }

  checkDuplicateTableNumbers(): boolean {
    const tableNumbers = this.tables.controls.map(control => 
      control.get('tableNo')?.value
    ).filter(num => num);
    
    return tableNumbers.length !== new Set(tableNumbers).size;
  }

  saveAllTables(): void {
    if (this.isSaving) return;

    // Check form validity
    if (!this.form.valid) {
      console.log('Form invalid. Errors:', this.form.errors);
      
      // Log individual table errors
      this.tables.controls.forEach((control, index) => {
        if (control.invalid) {
          console.log(`Table ${index} errors:`, control.errors);
          const tableNoError = control.get('tableNo')?.errors;
          const tableNameError = control.get('tableName')?.errors;
          console.log(`  - Table No: ${tableNoError || 'valid'}`);
          console.log(`  - Table Name: ${tableNameError || 'valid'}`);
        }
      });

      this.showError('Please fix all errors before saving');
      return;
    }

    this.isSaving = true;

    const tables = this.form.value.tables.map((value: any) => ({
      tableId: value.tableId ? parseInt(value.tableId) : 0,
      areaId: this.selectedAreaId,
      tableNo: parseInt(value.tableNo),
      tableName: value.tableName,
      tableDesc: value.tableName,
      isActive: true
    }));

    console.log('Saving tables:', tables);
    console.log('Total tables to save:', tables.length);

    this.service.saveAllTables(tables).subscribe({
      next: (response) => {
        console.log('Save response:', response);
        this.showSuccess(`${tables.length} table(s) saved successfully`);
        this.isSaving = false;
        this.isEditMode = false;
        
        // Update allLoadedTables with new data
        this.allLoadedTables.set(this.selectedAreaId!, tables);
        this.loadSavedTables(this.selectedAreaId!);
      },
      error: (error) => {
        console.error('Error saving tables:', error);
        this.showError('Failed to save tables');
        this.isSaving = false;
      }
    });
  }

  goToQR(): void {
    this.router.navigate(['/qrgenerator']);
  }

  private showSuccess(message: string): void {
    this.snackBar.open(message, 'Close', {
      duration: 3000,
      horizontalPosition: 'end',
      verticalPosition: 'top',
      panelClass: ['success-snackbar']
    });
  }

  private showError(message: string): void {
    this.snackBar.open(message, 'Close', {
      duration: 5000,
      horizontalPosition: 'end',
      verticalPosition: 'top',
      panelClass: ['error-snackbar']
    });
  }
}