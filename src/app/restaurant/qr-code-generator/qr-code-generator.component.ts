// ============================================
// QR CODE GENERATOR COMPONENT - FIXED
// ============================================

import { ElementRef, ChangeDetectorRef, Component, OnInit, Inject, PLATFORM_ID } from '@angular/core';
import { forkJoin } from 'rxjs';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RestaurantService } from '../../Services/restaurant.service';
import { TSTable } from '../../models/TSTable';
import { QrCodeModule } from 'ng-qrcode';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { MatFormFieldModule, MatLabel } from '@angular/material/form-field';
import {  MatSelect } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDividerModule } from '@angular/material/divider';
import { BackButtonComponent } from '../../common/back-button/back-button.component';
import { Router } from '@angular/router';
import { MatOptionModule } from '@angular/material/core';
import { SessionService } from '../../Services/session.service';

@Component({
  selector: 'app-qr-code-generator',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    QrCodeModule,
    MatFormFieldModule,
    MatLabel,
    MatSelect,
    MatOptionModule,
    MatIconModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    MatCheckboxModule,
    MatDividerModule,
    BackButtonComponent
  ],
  templateUrl: './qr-code-generator.component.html',
  styleUrl: './qr-code-generator.component.scss'
})
export class QrCodeGeneratorComponent implements OnInit {
  // ============================================
  // FORM & PROPERTIES
  // ============================================

  qrForm: FormGroup;
  isBrowser: boolean = false;
  restaurantId: number = 0;
  restaurantname: string = '';

  // ============================================
  // DATA PROPERTIES
  // ============================================

  areas: any[] = [];
  tables: TSTable[] = [];
  allTables: TSTable[] = [];
  qrCodes: { tableName: string; areaId: number; tableId: number; qrData: string }[] = [];
  selectedQRCodes: any[] = [];

  // ============================================
  // UI STATE PROPERTIES
  // ============================================

  showSelectAll: boolean = false;
  allSelected: boolean = false;
  selectAllToggle: boolean = false;
  areaName: string = '';
  isAllAreas: boolean = false;

  // ============================================
  // LOADING STATE PROPERTIES
  // ============================================

  isLoadingTables: boolean = false;
  isLoadingAllAreas: boolean = false;

  // ============================================
  // QR SIZE OPTIONS
  // ============================================

  qrSizes = [
    { label: 'Select Size', size: 0, rows: 0, cols: 0 },
    { label: '2x2 inches - 12 labels per sheet [3 Columns, 4 Rows]', size: 170, rows: 4, cols: 3 },
    { label: '2x2 inches - 20 labels per sheet [4 Columns, 5 Rows]', size: 169, rows: 5, cols: 4 },
    { label: '3x3 inches - 6 labels per sheet [2 Columns, 3 Rows]', size: 288, rows: 3, cols: 2 }
  ];

  // ============================================
  // CONSTRUCTOR
  // ============================================

  constructor(
    private router: Router,
    @Inject(PLATFORM_ID) private platformId: Object,
    private service: RestaurantService,
    private cdr: ChangeDetectorRef,
    private fb: FormBuilder,
    private session: SessionService
  ) {
    this.isBrowser = isPlatformBrowser(this.platformId);

    if (this.isBrowser) {
      const storedId = this.session.getItem('restaurantId');
      this.restaurantId = storedId ? parseInt(storedId, 10) : 0;

      if (this.restaurantId === 0) {
        this.router.navigate(['login']);
      }

      const storedName = this.session.getItem('restaurantName');
      this.restaurantname = storedName || '';
    }

    // Initialize reactive form
    this.qrForm = this.fb.group({
      areaSelect: ['', Validators.required],
      tableSelect: [[], Validators.required],
      qrSize: [0, Validators.required],
      tables: this.fb.array([]),
      extraMarginTop: [70],
      extraMarginLeft: [60],
      extraMarginBetween: [40]
    });
  }

  // ============================================
  // LIFECYCLE HOOKS
  // ============================================

  ngOnInit(): void {
    if (this.isBrowser) {
      this.loadAreas();
    }
  }

  // ============================================
  // NAVIGATION
  // ============================================

  goHome(): void {
    this.router.navigate(['dashboard']);
  }

  // ============================================
  // LOAD DATA
  // ============================================

  loadAreas(): void {
    this.service.TSRestaurantAreas(this.restaurantId).subscribe(
      (areas: any[]) => {
        this.areas = this.sortAreas(areas);
      },
      (error) => {
        console.error('Error loading areas:', error);
      }
    );
  }

  /**
   * Sort areas alphabetically, handling numeric suffixes
   */
  private sortAreas(areas: any[]): any[] {
    return areas.sort((a, b) => {
      const aMatch = a.areaName.match(/(\D+)(\d+)/);
      const bMatch = b.areaName.match(/(\D+)(\d+)/);

      if (aMatch && bMatch && aMatch[1] === bMatch[1]) {
        return parseInt(aMatch[2]) - parseInt(bMatch[2]);
      }

      return a.areaName.localeCompare(b.areaName);
    });
  }

  /**
   * Sort tables alphabetically, handling numeric suffixes
   */
  private sortTables(tables: TSTable[]): TSTable[] {
    return tables.sort((a, b) => {
      const aMatch = a.tableName.match(/(\D+)(\d+)/);
      const bMatch = b.tableName.match(/(\D+)(\d+)/);

      if (aMatch && bMatch && aMatch[1] === bMatch[1]) {
        return parseInt(aMatch[2]) - parseInt(bMatch[2]);
      }

      return a.tableName.localeCompare(b.tableName);
    });
  }

  loadTables(areaId: number | null): void {
    if (areaId === 0) {
      // Load tables from all areas
      this.loadTablesFromAllAreas();
    } else if (areaId && areaId > 0) {
      // Load tables from specific area
      this.loadTablesFromArea(areaId);
    }
  }

  /**
   * Load tables from a specific area
   */
  private loadTablesFromArea(areaId: number): void {
    this.isLoadingTables = true;

    this.service.TSRestaurantTables(areaId).subscribe(
      (tables: TSTable[]) => {
        this.tables = this.sortTables(tables);
        this.isLoadingTables = false;
      },
      (error) => {
        console.error('Error loading tables for area:', error);
        this.isLoadingTables = false;
      }
    );
  }

  /**
   * Load tables from all areas
   */
  private loadTablesFromAllAreas(): void {
    if (this.areas.length === 0) {
      console.error('No areas available');
      this.isLoadingTables = false;
      return;
    }

    this.isLoadingAllAreas = true;
    this.allTables = [];

    const requests = this.areas.map(area => this.service.TSRestaurantTables(area.areaId));

    forkJoin(requests).subscribe({
      next: (results: TSTable[][]) => {
        this.allTables = results.flat();
        this.tables = this.sortTables([...this.allTables]);
        this.isLoadingAllAreas = false;
        this.isLoadingTables = false;
      },
      error: (error) => {
        console.error('Error loading tables for areas:', error);
        this.isLoadingAllAreas = false;
        this.isLoadingTables = false;
      }
    });
  }

  // ============================================
  // AREA & TABLE SELECTION
  // ============================================

  onAreaChange(event: any): void {
    const areaId = event.value;

    // Reset selections
    this.resetSelections();

    // Set area name
    if (areaId === 0) {
      this.isAllAreas = true;
      this.areaName = 'All Areas';
    } else {
      this.isAllAreas = false;
      this.areaName = this.getAreaName(areaId);
    }

    this.isLoadingTables = true;
    this.tables = [];
    this.loadTables(areaId);
  }

  /**
   * Handle Select All click - removes it from form value and selects all tables
   */
  handleSelectAllClick(): void {
    const tableSelectControl = this.qrForm.get('tableSelect');
    
    if (!tableSelectControl || this.tables.length === 0) {
      return;
    }

    const currentValue = tableSelectControl.value || [];
    const hasSelectAll = currentValue.includes('SELECT_ALL');

    if (this.selectAllToggle) {
      // Deselect all
      this.selectAllToggle = false;
      tableSelectControl.setValue([]);
    } else {
      // Select all
      this.selectAllToggle = true;
      const allTableIds = this.tables.map((table) => table.tableId);
      // Don't include 'SELECT_ALL' in the actual form value
      tableSelectControl.setValue(allTableIds);
    }
  }

  /**
   * Handle table selection change
   */
  onTableChange(event: any): void {
    let selectedTableIds = this.qrForm.get('tableSelect')?.value || [];

    // Filter out 'SELECT_ALL' from the form value
    selectedTableIds = selectedTableIds.filter((id: any) => id !== 'SELECT_ALL');
    
    // Update the form with filtered values (without SELECT_ALL)
    if (this.qrForm.get('tableSelect')?.value?.includes('SELECT_ALL')) {
      this.qrForm.get('tableSelect')?.setValue(selectedTableIds, { emitEvent: false });
    }

    // Update selectAllToggle based on actual selection
    if (this.tables.length > 0) {
      this.selectAllToggle = selectedTableIds.length === this.tables.length;
    } else {
      this.selectAllToggle = false;
    }

    // Reset QR code selection
    this.resetSelections();
    this.qrCodes = [];
    const formArray = this.qrForm.get('tables') as FormArray;
    formArray.clear();
    this.qrForm.get('qrSize')?.setValue(0);
  }

  cancelTableSelection(): void {
    const backdrop = document.querySelector('.cdk-overlay-backdrop') as HTMLElement;
    if (backdrop) {
      backdrop.click();
    }
  }

  getAreaName(areaId: number): string {
    const area = this.areas.find((a) => a.areaId === areaId);
    return area ? area.areaName : 'Unknown Area';
  }

  // ============================================
  // QR CODE GENERATION
  // ============================================

  onSizeChange(event: any): void {
    const selectedSize = event.value;

    this.resetSelections();

    const formArray = this.qrForm.get('tables') as FormArray;
    if (formArray.length > 0) {
      this.qrCodes.forEach((_, index) => {
        if (index < formArray.length) {
          formArray.at(index).setValue(false);
        }
      });
    }

    if (selectedSize > 0) {
      this.generateQRCodes(true);
      this.showSelectAll = true;
    } else {
      this.qrCodes = [];
      formArray.clear();
    }
  }

  /**
   * Generate QR codes for selected tables
   */
  private generateQRCodes(useUrlFormat: boolean = false): void {
    const selectedTableIds = this.qrForm.get('tableSelect')?.value || [];
    const isSelectAll = this.allSelected;

    this.qrCodes = this.tables
      .filter((table) => isSelectAll || selectedTableIds.includes(table.tableId))
      .map((table) => {
        let qrData: string;

        if (useUrlFormat) {
          const encoded = btoa(`${this.restaurantId}|${table.tableId}|${this.restaurantname}|RestApp|2`);
          qrData = `https://web.tablesignals.com/open?data=${encoded}`;
        } else {
          qrData = `${this.restaurantId}\n${this.areaName}\n${table.tableId}\nRestApp\n${this.restaurantname}`;
        }

        const area = this.areas.find((a) => a.areaId === table.areaId);
        const areaName = area ? area.areaName : '';
        const displayName = areaName ? `${areaName}:${table.tableName}` : table.tableName;

        return {
          tableName: displayName,
          areaId: table.areaId,
          tableId: table.tableId,
          qrData
        };
      });

    // Update form array
    const formArray = this.qrForm.get('tables') as FormArray;
    formArray.clear();
    this.qrCodes.forEach(() => {
      formArray.push(this.fb.control(false));
    });

    this.cdr.detectChanges();
  }

  // ============================================
  // QR CODE SELECTION
  // ============================================

  onSelectQr(qr: any, event: any): void {
    if (event.target.checked) {
      this.selectedQRCodes.push(qr);
    } else {
      this.selectedQRCodes = this.selectedQRCodes.filter((selectedQr) => selectedQr !== qr);
    }

    // Update "Select All" checkbox state
    this.allSelected = this.qrCodes.length === this.selectedQRCodes.length;
  }

  onSelectAll(event: any): void {
    this.allSelected = event.target.checked;
    const formArray = this.qrForm.get('tables') as FormArray;

    // Check/uncheck all checkboxes
    this.qrCodes.forEach((_, index) => {
      formArray.at(index).setValue(this.allSelected);
    });

    if (this.allSelected) {
      this.selectedQRCodes = [...this.qrCodes];
    } else {
      this.selectedQRCodes = [];
    }
  }

  // ============================================
  // PRINT FUNCTIONALITY
  // ============================================

  printSelectedQRCodes(): void {
    if (!this.validateSelection()) {
      return;
    }

    const selectedSize = this.qrForm.get('qrSize')?.value;
    const selectedLayout = this.qrSizes.find((layout) => layout.size === selectedSize);

    if (!selectedLayout) {
      alert('Please select the QR Code size');
      return;
    }

    // Route to appropriate print function based on size
    if (selectedLayout.rows === 4 && selectedLayout.cols === 3) {
      this.printQRCodesAvery2by2();
    } else if (selectedLayout.rows === 5 && selectedLayout.cols === 4) {
      this.printQRCodesSpartan2by2();
    } else if (selectedLayout.rows === 3 && selectedLayout.cols === 2) {
      this.printQRCodes3by3();
    }
  }

  /**
   * Print QR codes for Avery 2x2 labels (12 per sheet, 3x4)
   */
  private printQRCodesAvery2by2(): void {
    const selectedSize = this.qrForm.get('qrSize')?.value;
    const selectedLayout = this.qrSizes.find((layout) => layout.size === selectedSize);

    if (!selectedLayout) {
      return;
    }

    const { size, rows, cols } = selectedLayout;
    const codesPerPage = rows * cols;
    const totalPages = Math.ceil(this.selectedQRCodes.length / codesPerPage);

    const labelWidth = 2 * 96;
    const labelHeight = 2 * 96;
    const extraMarginTop = this.qrForm.get('extraMarginTop')?.value || 70;
    const extraMarginLeft = this.qrForm.get('extraMarginLeft')?.value || 60;

    let allPagesContent = '';

    for (let page = 0; page < totalPages; page++) {
      const startIdx = page * codesPerPage;
      let pageContent = '';

      for (let i = 0; i < codesPerPage; i++) {
        const qrIndex = startIdx + i;
        if (qrIndex >= this.selectedQRCodes.length) continue;

        const qr = this.selectedQRCodes[qrIndex];
        const isFirstRow = i < cols;
        const isFirstColumn = i % cols === 0;
        const isLastColumn = (i + 1) % cols === 0;

        const qrImageData = this.getQRCodeImage(qr);

        if (qrImageData) {
          pageContent += `
            <div style="
              width: ${labelWidth}px;
              height: ${labelHeight}px;
              display: inline-block;
              text-align: center;
              margin-top: ${isFirstRow ? extraMarginTop : 50}px;
              margin-bottom: 3px;
              margin-left: ${isFirstColumn ? extraMarginLeft : 3}px;
              margin-right: ${isLastColumn ? 20 : 50}px;
              box-sizing: border-box;
            ">
              <img src="${qrImageData}" style="width: ${size - 10}px; height: ${size - 10}px;" />
              <div style="font-size: 10px; margin-top: -7px;">${qr.tableName}</div>
            </div>
          `;
        }
      }

      const pageBreak = page < totalPages - 1 ? '<div style="page-break-after: always;"></div>' : '';
      allPagesContent += `<div class="page">${pageContent}${pageBreak}</div>`;
    }

    this.printContent(allPagesContent);
  }

  /**
   * Print QR codes for Spartan 2x2 labels (20 per sheet, 4x5)
   */
  private printQRCodesSpartan2by2(): void {
    const selectedSize = this.qrForm.get('qrSize')?.value;
    const selectedLayout = this.qrSizes.find((layout) => layout.size === selectedSize);

    if (!selectedLayout) {
      return;
    }

    const { size, rows, cols } = selectedLayout;
    const codesPerPage = rows * cols;
    const totalPages = Math.ceil(this.selectedQRCodes.length / codesPerPage);

    const labelWidth = 2 * 90;
    const labelHeight = 2 * 90;

    let allPagesContent = '';

    for (let page = 0; page < totalPages; page++) {
      const startIdx = page * codesPerPage;
      let pageContent = '';

      for (let i = 0; i < codesPerPage; i++) {
        const qrIndex = startIdx + i;
        if (qrIndex >= this.selectedQRCodes.length) continue;

        const qr = this.selectedQRCodes[qrIndex];
        const isFirstRow = i < cols;

        const qrImageData = this.getQRCodeImage(qr);

        if (qrImageData) {
          pageContent += `
            <div style="
              width: ${labelWidth}px;
              height: ${labelHeight}px;
              display: inline-block;
              text-align: center;
              margin-top: ${isFirstRow ? 30 : 23}px;
              margin-bottom: 6px;
              margin-left: 20px;
              margin-right: 0;
              box-sizing: border-box;
            ">
              <img src="${qrImageData}" style="width: ${size - 30}px; height: ${size - 30}px;" />
              <div style="font-size: 10px; margin-top: -7px;">${qr.tableName}</div>
            </div>
          `;
        }
      }

      const pageBreak = page < totalPages - 1 ? '<div style="page-break-after: always;"></div>' : '';
      allPagesContent += `<div class="page">${pageContent}${pageBreak}</div>`;
    }

    this.printContent(allPagesContent);
  }

  /**
   * Print QR codes for 3x3 labels (6 per sheet, 2x3)
   */
  private printQRCodes3by3(): void {
    const selectedSize = this.qrForm.get('qrSize')?.value;
    const selectedLayout = this.qrSizes.find((layout) => layout.size === selectedSize);

    if (!selectedLayout) {
      return;
    }

    const { size, rows, cols } = selectedLayout;
    const codesPerPage = rows * cols;
    const totalPages = Math.ceil(this.selectedQRCodes.length / codesPerPage);

    const labelWidth = 2 * 120;
    const labelHeight = 2 * 120;

    let allPagesContent = '';

    for (let page = 0; page < totalPages; page++) {
      const startIdx = page * codesPerPage;
      let pageContent = '';

      for (let i = 0; i < codesPerPage; i++) {
        const qrIndex = startIdx + i;
        if (qrIndex >= this.selectedQRCodes.length) continue;

        const qr = this.selectedQRCodes[qrIndex];
        const isFirstRow = i < cols;
        const isFirstColumn = i % cols === 0;
        const isLastColumn = (i + 1) % cols === 0;

        const qrImageData = this.getQRCodeImage(qr);

        if (qrImageData) {
          pageContent += `
            <div style="
              width: ${labelWidth}px;
              height: ${labelHeight}px;
              vertical-align: middle;
              display: inline-block;
              text-align: center;
              margin-top: ${isFirstRow ? 100 : 3}px;
              margin-bottom: 0;
              margin-left: ${isFirstColumn ? 125 : 70}px;
              margin-right: ${isLastColumn ? 20 : 50}px;
              box-sizing: border-box;
            ">
              <img src="${qrImageData}" style="width: ${size - 70}px; height: ${size - 70}px;" />
              <div style="font-size: 10px; margin-top: -7px;">${qr.tableName}</div>
            </div>
          `;
        }
      }

      const pageBreak = page < totalPages - 1 ? '<div style="page-break-after: always;"></div>' : '';
      allPagesContent += `<div class="page">${pageContent}${pageBreak}</div>`;
    }

    this.printContent(allPagesContent);
  }

  /**
   * Get QR code image data from canvas
   */
  private getQRCodeImage(qr: any): string | null {
    let canvasIndex = -1;

    for (let j = 0; j < this.qrCodes.length; j++) {
      if (this.qrCodes[j].tableId === qr.tableId && this.qrCodes[j].areaId === qr.areaId) {
        canvasIndex = j;
        break;
      }
    }

    if (canvasIndex === -1) {
      return null;
    }

    const canvasElements = Array.from(document.querySelectorAll('canvas'));
    if (canvasIndex < canvasElements.length) {
      const qrCanvas = canvasElements[canvasIndex] as HTMLCanvasElement;
      return qrCanvas.toDataURL('image/png');
    }

    return null;
  }

  /**
   * Open print window with content
   */
  private printContent(content: string): void {
    const popupWindow = window.open('', '_blank', 'width=900,height=650');

    if (popupWindow) {
      popupWindow.document.write(`
        <html>
          <head>
            <style>
              @media print {
                @page {
                  margin-top: 0;
                  margin-bottom: 0;
                  margin-left: 0;
                  margin-right: 0;
                }
                body { margin: 0; padding: 0; }
                .page { display: flex; flex-wrap: wrap; justify-content: flex-start; }
                div { page-break-inside: avoid; box-sizing: border-box; }
              }
            </style>
            <title>${this.restaurantname} - QR Codes</title>
          </head>
          <body>${content}</body>
        </html>
      `);

      popupWindow.document.close();
      popupWindow.focus();

      popupWindow.addEventListener('load', () => {
        popupWindow.print();
      });
    }
  }

  // ============================================
  // DOWNLOAD FUNCTIONALITY
  // ============================================

  downloadSelectedQRCodes(): void {
    if (!this.validateSelection()) {
      return;
    }

    if (this.selectedQRCodes.length > 10) {
      const confirmDownload = confirm(
        `You are about to download ${this.selectedQRCodes.length} QR codes. This may take some time. Continue?`
      );
      if (!confirmDownload) {
        return;
      }
    }

    // Process downloads in batches
    const batchSize = 5;
    const totalBatches = Math.ceil(this.selectedQRCodes.length / batchSize);

    const processNextBatch = (batchIndex: number) => {
      if (batchIndex >= totalBatches) {
        return;
      }

      const startIdx = batchIndex * batchSize;
      const endIdx = Math.min(startIdx + batchSize, this.selectedQRCodes.length);

      for (let i = startIdx; i < endIdx; i++) {
        const qr = this.selectedQRCodes[i];
        const qrImageData = this.getQRCodeImage(qr);

        if (qrImageData) {
          const link = document.createElement('a');
          link.href = qrImageData;
          link.download = `${qr.tableName.replace(/[/\\?%*:|"<>]/g, '-')}-qr-code.png`;
          link.click();
        }
      }

      setTimeout(() => {
        processNextBatch(batchIndex + 1);
      }, 500);
    };

    processNextBatch(0);
  }

  // ============================================
  // UTILITY METHODS
  // ============================================

  /**
   * Get count of selected tables (excludes SELECT_ALL sentinel)
   */
  getSelectedTableCount(): number {
    const selectedValues = this.qrForm.get('tableSelect')?.value || [];
    return selectedValues.filter((v: any) => v !== 'SELECT_ALL').length;
  }

  /**
   * Validate that user has selected QR codes
   */
  private validateSelection(): boolean {
    const selectedSize = this.qrForm.get('qrSize')?.value;
    const selectedLayout = this.qrSizes.find((layout) => layout.size === selectedSize);

    if (!selectedLayout) {
      alert('Please select the QR Code size');
      return false;
    }

    if (this.selectedQRCodes.length === 0) {
      alert('Please select at least one QR code');
      return false;
    }

    return true;
  }

  /**
   * Reset all selections
   */
  private resetSelections(): void {
    this.allSelected = false;
    this.showSelectAll = false;
    this.selectedQRCodes = [];
  }

  /**
   * Form submission handler
   */
  onSubmit(): void {
    if (this.qrForm.valid) {
      this.generateQRCodes();
    }
  }

  trackByAreaId(_: number, area: any): number { return area.areaId; }
  trackByTableId(_: number, table: TSTable): number { return table.tableId; }
  trackByQRIndex(index: number): number { return index; }
}