import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { TSArea } from '../../models/TSArea';
import { RestaurantService } from '../../Services/restaurant.service';
import { forkJoin } from 'rxjs';
import { Router } from '@angular/router';
import { MatIcon } from '@angular/material/icon';
import { BackButtonComponent } from '../../common/back-button/back-button.component';
import { SessionService } from '../../Services/session.service';

@Component({
  selector: 'app-dynamic-textboxes',
  standalone: true,
  imports: [
    CommonModule,
    MatIcon,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    MatButtonModule,
    BackButtonComponent
  ],
  templateUrl: './areas.component.html',
  styleUrls: ['./areas.component.scss']
})
export class AreasComponent implements OnInit {
  form: FormGroup;
  numbers: number[] = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20]; // List of numbers for the dropdown
  sidenavVisible: boolean = true;
  restaurantId!: number;
  isSaving: any;

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
      numberSelect: [1, Validators.required],
      textboxes: this.fb.array([])  // Initialize with one textbox group
    });
  }
  goHome(){this.router.navigate(['dashboard']);}
  ngOnInit(): void {
    this.loadAreasFromApi();
  }

  // Load areas from API and populate the form
  loadAreasFromApi() {
    this.textboxes.clear();
    this.service.TSRestaurantAreas(this.restaurantId).subscribe((areas: TSArea[]) => {
      // Sort areas using natural sort with Intl.Collator
      const collator = new Intl.Collator(undefined, {numeric: true, sensitivity: 'base'});
      const sortedAreas = areas.sort((a, b) => 
        collator.compare(a.areaName, b.areaName)
      );
      
      // Add the sorted areas to the form
      sortedAreas.forEach(area => {
        this.textboxes.push(this.createTextboxGroup(area.areaName, area.areaId));
      });
      
      this.form.patchValue({
        numberSelect: areas.length
      });
    });
  }
  // Toggle sidenav
  toggleSidenav(): void {
    this.sidenavVisible = !this.sidenavVisible;
  }

  // Get textboxes form array
  get textboxes(): FormArray {
    return this.form.get('textboxes') as FormArray;
  }
// Add this method to your component class
checkDuplicateAreaNames(): boolean {
  const areaNames = this.textboxes.controls.map(control => 
    control.get('areaName')?.value.trim().toLowerCase());
  
  // Check for duplicates using Set
  return areaNames.length !== new Set(areaNames).size;
}
  // Create a textbox group for area
  createTextboxGroup(areaName: string, areaId: number): FormGroup {
    return this.fb.group({
      areaID: [areaId],  // Hidden AreaID control
      areaName: [areaName, Validators.required]  // Visible AreaName control
    });
  }

  // Handle number selection change
  onNumberChange(event: any) {
    const count = event.value;
    this.updateTextboxes(count);
  }

  // Update textboxes based on selected number of areas
  updateTextboxes(count: number) {
    while (this.textboxes.length > count) {
      this.textboxes.removeAt(this.textboxes.length - 1);  // Remove extra textboxes
    }
    while (this.textboxes.length < count) {
      this.textboxes.push(this.createTextboxGroup('', 0));  // Add new empty textboxes
    }
  }

  // Add a new textbox dynamically
  addTextbox() {
    this.isSaving=false;
    this.textboxes.push(this.createTextboxGroup('', 0));
    this.form.get('numberSelect')?.setValue(this.textboxes.length);
  }

  // Save values to the server
 saveValues() {
  if (this.isSaving) return;
  if (this.checkDuplicateAreaNames()) {
    alert('Error: Duplicate area names are not allowed.');
    return;
  }
  this.isSaving = true;

  if (this.form.valid) {
    const values = this.form.value.textboxes;
    
    // Execute requests sequentially instead of concurrently
    this.saveSingleArea(values, 0);
  }
}

saveSingleArea(values: any[], index: number) {
  if (index >= values.length) {
    alert('Areas are saved successfully!');
    this.isSaving = false;
    this.loadAreasFromApi();
    return;
  }

  const value = values[index];
  const mode = value.areaID === 0 ? 'I' : 'U';
  const area: TSArea = {
    areaId: value.areaID || 0,
    restaurantId: this.restaurantId,
    areaName: value['areaName'],
    areaDesc: value['areaName'],
    mode: mode
  };

  this.service.TSAreaSetup(area).subscribe(
    () => {
      console.log(`Area ${index + 1} saved`);
      this.saveSingleArea(values, index + 1); // Save next area
    },
    (error) => {
      console.error('Error saving area:', error);
      alert(`Failed to save area at position ${index + 1}`);
      this.isSaving = false;
    }
  );
}

  // Navigate to tables page
  GoToTables() {
    this.router.navigate(['/area1']);
  }

  // Disable the dropdown numbers below the current number of textboxes
  disableDropdownValue(num: number): boolean {
    return num <= this.textboxes.length;
  }

  // Handle the deletion of an area
  deleteArea(index: number) {
    const areaToRemove = this.textboxes.at(index).value;

    if (confirm(`Are you sure you want to delete area "${areaToRemove.areaName}"?`)) {
      const areaId = areaToRemove.areaID;

      // If areaId is not 0, call the API to delete the area
      if (areaId !== 0) {
        this.service.TSAreaDelete(areaId).subscribe(
          () => {
            console.log('Area deleted successfully');
            alert('Area deleted successfully!');
            this.textboxes.removeAt(index);  // Remove from the form array
            this.form.get('numberSelect')?.setValue(this.textboxes.length);  // Update numberSelect value
          },
          (error) => {
            console.error('Error deleting area:', error);
            alert('Failed to delete area.');
          }
        );
      } else {
        // If areaId is 0, it means it is a newly added unsaved area, just remove it from the form array
        this.textboxes.removeAt(index);
        this.form.get('numberSelect')?.setValue(this.textboxes.length);
      }
    }
  }
}
