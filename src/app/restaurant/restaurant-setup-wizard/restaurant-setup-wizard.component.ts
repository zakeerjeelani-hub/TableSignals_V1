import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule, FormBuilder, FormGroup, Validators, FormArray } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

// Material Imports
import { MatStepperModule, MatStepper } from '@angular/material/stepper';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatRadioModule } from '@angular/material/radio';
import { MatCardModule } from '@angular/material/card';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';

// QR Code Import
import { QrCodeModule } from 'ng-qrcode';

import { RestaurantService } from '../../Services/restaurant.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { SessionService } from '../../Services/session.service';

@Component({
  selector: 'app-restaurant-setup-wizard',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    MatStepperModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatRadioModule,
    MatCardModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    MatDialogModule,
    QrCodeModule,
  ],
  templateUrl: './restaurant-setup-wizard.component.html',
  styleUrls: ['./restaurant-setup-wizard.component.scss']
})
export class RestaurantSetupWizardComponent implements OnInit, OnDestroy {

  @ViewChild('stepper') stepper!: MatStepper;
  private destroy$ = new Subject<void>();

  // Wizard steps
  currentStep = 0;
  
  // Form Groups
  setupTypeForm: FormGroup;
  areaTypeForm: FormGroup;
  singleAreaForm: FormGroup;
  multipleAreasForm: FormGroup;
  imagesForm: FormGroup;

  // Data
  setupType: string = ''; // 'quick' or 'custom'
  areaType: string = ''; // 'single' or 'multiple'
  restaurantId: number = 0;
  restaurantName: string = '';
  selectedImages: File[] = [];
  uploadedImagePreviews: string[] = [];
  isSubmitting = false;

  // ✅ NEW: QR Code properties
  qrData: string = '';
  showQRPopup: boolean = false;

  // ✅ NEW: Track table counter for dynamic range assignment
  totalTablesAssigned: number = 0;

  constructor(
    
        private router: Router,
    private fb: FormBuilder,
    private restaurantService: RestaurantService,
    private session: SessionService,
    private snackBar: MatSnackBar,
    private dialog: MatDialog
  ) {
    this.restaurantId = this.session.getNumber('restaurantId');
    this.restaurantName = this.session.getItem('restaurantName') ?? '';

    // Step 1: Setup Type Form (Quick or Custom) - ✅ UPDATED: Removed restaurantId field
    this.setupTypeForm = this.fb.group({
      setupType: ['', Validators.required]
    });

    // Step 2: Area Type Form (Single or Multiple)
    this.areaTypeForm = this.fb.group({
      areaType: ['', Validators.required]
    });

    // Step 3: Single Area Form - ✅ areaName + tableCount
    this.singleAreaForm = this.fb.group({
      areaName: ['', [Validators.required, Validators.minLength(1), Validators.pattern(/.*\S.*/)]],
      tableCount: [null, [Validators.required, Validators.min(1)]] // ✅ Changed to tableCount
    });

    // Step 3: Multiple Areas Form
    this.multipleAreasForm = this.fb.group({
      areas: this.fb.array([this.createAreaFormGroup()])
    });

    // Step 4: Images Form
    this.imagesForm = this.fb.group({
      images: ['']
    });
  }

  ngOnInit(): void {
    this.setupTypeForm.get('setupType')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((value) => { this.setupType = value; });

    this.areaTypeForm.get('areaType')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((value) => {
        this.areaType = value;
        this.totalTablesAssigned = 0;
      });

    if (this.stepper) {
      this.stepper.selectionChange
        .pipe(takeUntil(this.destroy$))
        .subscribe((event) => {
          this.currentStep = event.selectedIndex;
          if (event.selectedIndex === 2) {
            this.totalTablesAssigned = 0;
          }
        });
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ✅ NEW: Handle stepper step changes
  onStepChange(event: any): void {
    this.currentStep = event.selectedIndex;

    if (event.selectedIndex === 1) {
      const selectedType = this.setupTypeForm.get('setupType')?.value;

      if (selectedType == 'custom') {
        this.router.navigate(['areas']);
        return;
      }
    }

    // When moving to step 3 (Area Details - index 2), capture the area type
    if (event.selectedIndex === 2) {
      const selectedType = this.areaTypeForm.get('areaType')?.value;

      if (selectedType) {
        this.areaType = selectedType;
      }
    }
  }

  // ✅ UPDATED: Create area form group with areaName and tableCount
  createAreaFormGroup(): FormGroup {
    return this.fb.group({
      areaName: ['', [Validators.required, Validators.minLength(1), Validators.pattern(/.*\S.*/)]],
      tableCount: [null, [Validators.required, Validators.min(1)]] // ✅ Changed to tableCount with min(1)
    });
  }

  // Get FormArray for areas
  get areasArray(): FormArray {
    return this.multipleAreasForm.get('areas') as FormArray;
  }

  // Add new area to FormArray
  addArea(): void {
    if (!this.canAddAnotherArea()) {
      this.areasArray.markAllAsTouched();
      this.snackBar.open('Please complete the current area name and table count before adding another area.', 'Close', { duration: 3000 });
      return;
    }

    const areaForm = this.createAreaFormGroup();
    this.areasArray.push(areaForm);
  }

  private isValidAreaEntry(area: FormGroup | any): boolean {
    const areaNameControl = area instanceof FormGroup ? area.get('areaName') : null;
    const tableCountControl = area instanceof FormGroup ? area.get('tableCount') : null;

    const areaName = `${areaNameControl?.value ?? area?.areaName ?? ''}`.trim();
    const tableCount = Number(tableCountControl?.value ?? area?.tableCount ?? 0);

    const controlsValid = area instanceof FormGroup
      ? !!areaNameControl?.valid && !!tableCountControl?.valid
      : true;

    return controlsValid && areaName.length > 0 && tableCount >= 1;
  }

  canAddAnotherArea(): boolean {
    return this.areasArray.length > 0 && this.areasArray.controls.every((area) => this.isValidAreaEntry(area));
  }

  // Remove area from FormArray
  removeArea(index: number): void {
    if (this.areasArray.length > 1) {
      this.areasArray.removeAt(index);
    } else {
      this.snackBar.open('You must have at least one area', 'Close', { duration: 3000 });
    }
  }

  // ✅ NEW: Calculate table ranges dynamically
  // Example: Area1 (10 tables) → 1-10, Area2 (5 tables) → 11-15
  calculateTableRanges(areas: any[]): any[] {
    let currentTableNumber = 1;
    const areasWithRanges: any[] = [];

    for (const area of areas) {
      const tableCount = area.tableCount;
      const tableStart = currentTableNumber;
      const tableEnd = currentTableNumber + tableCount - 1;

      areasWithRanges.push({
        areaName: area.areaName,
        tableStart: tableStart,
        tableEnd: tableEnd,
        tableCount: tableCount // ✅ Keep original count for reference
      });

      
      currentTableNumber = tableEnd + 1; // ✅ Next area starts after this area ends
    }

    return areasWithRanges;
  }

  // ✅ NEW: Get table range info for display (single area)
  getSingleAreaTableRange(): { start: number; end: number; count: number } {
    const tableCount = this.singleAreaForm.get('tableCount')?.value || 0;
    return {
      start: 1,
      end: tableCount,
      count: tableCount
    };
  }

  // ✅ NEW: Get table range info for display (multiple areas)
  getMultipleAreasTableRanges(): any[] {
    const areas = this.areasArray.value;
    let currentTableNumber = 1;
    const result: any[] = [];

    for (const area of areas) {
      const tableCount = area.tableCount || 0;
      const tableStart = currentTableNumber;
      const tableEnd = currentTableNumber + tableCount - 1;

      result.push({
        areaName: area.areaName,
        tableStart: tableStart,
        tableEnd: tableEnd,
        tableCount: tableCount
      });

      currentTableNumber = tableEnd + 1;
    }

    return result;
  }

  // Helper method to check if we can proceed - ✅ Updated validation logic
  canProceed(): boolean {
    const stepIndex = this.currentStep;
    
    // console.log('canProceed() called - Step:', stepIndex, 'AreaType:', this.areaType);

    switch (stepIndex) {
      case 0: // Step 1: Setup Type
        const setupValid = this.setupTypeForm.valid;
        return setupValid;

      case 1: // Step 2: Area Type
        const areaTypeValid = this.areaTypeForm.valid;
        return areaTypeValid;

      case 2: // Step 3: Area Details
        if (this.areaType === 'single') {
          const areaName = `${this.singleAreaForm.get('areaName')?.value ?? ''}`.trim();
          const tableCount = Number(this.singleAreaForm.get('tableCount')?.value ?? 0);

          return this.singleAreaForm.valid && areaName.length > 0 && tableCount >= 1;
        } else if (this.areaType === 'multiple') {
          return this.multipleAreasForm.valid && this.canAddAnotherArea();
        }
        return false;

      case 3: // Step 4: Upload Menu
        return true; // Images are optional

      default:
        return false;
    }
  }

  // Handle image selection
  onImageSelected(event: any): void {
    const files: FileList = event.target.files;
    this.selectedImages = Array.from(files);
    this.generateImagePreviews();
  }

  // Generate image previews
  generateImagePreviews(): void {
    this.uploadedImagePreviews = [];
    this.selectedImages.forEach(file => {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.uploadedImagePreviews.push(e.target.result);
      };
      reader.readAsDataURL(file);
    });
  }

  // Convert images to base64
  async convertImagesToBase64(): Promise<string[]> {
    const base64Images: string[] = [];

    for (const file of this.selectedImages) {
      const base64 = await this.fileToBase64(file);
      base64Images.push(base64.split(',')[1]); // Remove data URL prefix
    }

    return base64Images;
  }

  // File to Base64 helper
  fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
      reader.readAsDataURL(file);
    });
  }

  // ✅ NEW: Generate QR Code
  generateQRCode(): void {
    const encoded = btoa(`${this.restaurantId}|0|${this.restaurantName}|RestApp|1`);

    this.qrData = `https://web.tablesignals.com/open?data=${encoded}`;
  }

  // ✅ NEW: Show QR Code Popup
  showQRCodePopup(): void {
    this.showQRPopup = true;
    this.generateQRCode();
  }

  // ✅ NEW: Close QR Code Popup
  closeQRCodePopup(): void {
    this.showQRPopup = false;
    this.router.navigate(['dashboard']);
  }

  // ✅ NEW: Download QR Code
  downloadQRCode(): void {
    const qrElement = document.querySelector('qr-code canvas');
    if (qrElement && qrElement instanceof HTMLCanvasElement) {
      const url = qrElement.toDataURL('image/png');
      const link = document.createElement('a');
      link.href = url;
      link.download = `restaurant-${this.restaurantId}-qr.png`;
      link.click();
      this.snackBar.open('✅ QR Code downloaded!', 'Close', { duration: 3000 });
    }
  }

  // ✅ NEW: Copy QR URL to Clipboard
  copyQRURL(): void {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(this.qrData).then(() => {
        this.snackBar.open('✅ QR URL copied to clipboard!', 'Close', { duration: 3000 });
      });
    } else {
      // Fallback for older browsers
      const textarea = document.createElement('textarea');
      textarea.value = this.qrData;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      this.snackBar.open('✅ QR URL copied to clipboard!', 'Close', { duration: 3000 });
    }
  }

  // ✅ NEW: Main submission logic with dynamic range calculation
  async submitForm(): Promise<void> {
    this.isSubmitting = true;

    try {
      // ✅ Validate that restaurantId is available
      if (!this.restaurantId || this.restaurantId <= 0) {
        this.snackBar.open('❌ Restaurant ID is not valid. Please check your session.', 'Close', { duration: 5000 });
        this.isSubmitting = false;
        return;
      }

      const menuImages = await this.convertImagesToBase64();
      let areasWithTableRanges: any[] = [];

      if (this.areaType === 'single') {
        // ✅ Single area logic
        const areaName = `${this.singleAreaForm.get('areaName')?.value ?? ''}`.trim();
        const tableCount = Number(this.singleAreaForm.get('tableCount')?.value ?? 0);

        if (!areaName || tableCount <= 0) {
          this.singleAreaForm.markAllAsTouched();
          this.snackBar.open('Please enter valid area name and table count', 'Close', { duration: 3000 });
          this.isSubmitting = false;
          return;
        }

        // ✅ Calculate range: 1 to tableCount
        areasWithTableRanges = [
          {
            areaName: areaName,
            tableStart: 1,
            tableEnd: tableCount
          }
        ];

      } else {
        // ✅ Multiple areas logic
        const areas = this.areasArray.value;

        if (areas.length === 0 || areas.some((area: any) => !this.isValidAreaEntry(area))) {
          this.areasArray.markAllAsTouched();
          this.snackBar.open('Please fill all area names and table counts', 'Close', { duration: 3000 });
          this.isSubmitting = false;
          return;
        }

        // ✅ Calculate ranges dynamically
        areasWithTableRanges = this.calculateTableRanges(areas);

      }

      // Prepare request - ✅ restaurantId from session service
      const request = {
        restaurantId: this.restaurantId,
        areasWithTableRanges: areasWithTableRanges,
        menuImages: menuImages
      };


      // ✅ Call API
      this.restaurantService.createAreasWithTables(request).subscribe(
        (response: any) => {
          if (response.success || response.isSuccess) {
            this.snackBar.open(
              `✅ Successfully created ${response.areasCreated} areas and ${response.tablesCreated} tables!`,
              'Close',
              { duration: 5000 }
            );
            
            // ✅ NEW: Show QR Code Popup after success
            setTimeout(() => {
              this.showQRCodePopup();
            }, 500);
          } else {
            this.snackBar.open(`❌ Error: ${response.status || response.message}`, 'Close', { duration: 5000 });
          }
          this.isSubmitting = false;
        },
        (error: any) => {
          console.error('API Error:', error);
          this.snackBar.open('❌ Failed to create areas and tables. Please try again.', 'Close', { duration: 5000 });
          this.isSubmitting = false;
        }
      );
    } catch (error) {
      console.error('Error processing images:', error);
      this.snackBar.open('❌ Error processing images. Please try again.', 'Close', { duration: 5000 });
      this.isSubmitting = false;
    }
  }

  // Reset wizard
  resetWizard(): void {
    this.currentStep = 0;
    this.setupType = '';
    this.areaType = '';
    this.selectedImages = [];
    this.uploadedImagePreviews = [];
    this.totalTablesAssigned = 0;
    this.qrData = '';  // ✅ NEW: Reset QR data
    this.showQRPopup = false;  // ✅ NEW: Close QR popup
    
    this.setupTypeForm.reset({ setupType: '' });
    this.areaTypeForm.reset({ areaType: '' });
    this.singleAreaForm.reset({ areaName: '', tableCount: null });
    this.imagesForm.reset();
    
    // Clear areas array and add one empty area
    while (this.areasArray.length > 0) {
      this.areasArray.removeAt(0);
    }
    this.areasArray.push(this.createAreaFormGroup());

    // Reset stepper to step 0
    if (this.stepper) {
      this.stepper.reset();
    }
  }
}