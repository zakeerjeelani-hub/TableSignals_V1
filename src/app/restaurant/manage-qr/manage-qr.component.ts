import { animate, style, transition, trigger } from '@angular/animations';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Component, Inject, OnInit, PLATFORM_ID } from '@angular/core';
import { Router } from '@angular/router';
import { MatIcon } from '@angular/material/icon';
import { QrCodeModule } from 'ng-qrcode';
import { MatSnackBar } from '@angular/material/snack-bar';
import { FormsModule } from '@angular/forms';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatInputModule } from '@angular/material/input';
import { RestaurantService } from '../../Services/restaurant.service';
import { BackButtonComponent } from '../../common/back-button/back-button.component';
import { SessionService } from '../../Services/session.service';

// ── Interfaces ────────────────────────────────────────────────

interface QRSizeConfig {
  label: string;
  avery: string;      // Avery product number — empty string = placeholder row
  size: number;       // kept for reference; imgSize drives actual rendering
  rows: number;
  cols: number;
  labelW: number;     // label width  in CSS px (96 px = 1 inch at screen DPI)
  labelH: number;     // label height in CSS px
  imgSize: number;    // QR image size in px (labelW minus padding)
  marginTop: number;  // page top margin in px  — from Avery spec
  marginLeft: number; // page left margin in px — from Avery spec
  gapX: number;       // horizontal gap between labels in px
  gapY: number;       // vertical gap between labels in px
  showLabel: boolean;   // whether to print restaurant name
  overlayLabel: boolean; // true = name overlaid as bottom strip on QR; false = name below QR
}

interface RequestType {
  requestTypeID: number;
  requestName: string;
  isCustomRequest: boolean;
  qrId: number;
  restaurantId: number;
  description: string | null;
  isRestaurantInfo: boolean;
}

interface SaveQRResponse {
  status: string;
  qrId: number;
}

interface CustomQRForm {
  requestTypeId: number | null;
  description: string;
  isRestaurantInfo: boolean;
}

// ── Component ─────────────────────────────────────────────────

@Component({
  selector: 'app-manage-qr',
  standalone: true,
  imports: [
    BackButtonComponent,
    CommonModule,
    MatIcon,
    QrCodeModule,
    FormsModule,
    MatProgressSpinnerModule,
    MatSelectModule,
    MatFormFieldModule,
    MatCheckboxModule,
    MatInputModule,
  ],
  templateUrl: './manage-qr.component.html',
  styleUrl: './manage-qr.component.scss',
  animations: [
    trigger('cardHover', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(10px)' }),
        animate('0.4s 0.1s ease-out', style({ opacity: 1, transform: 'translateY(0)' })),
      ]),
    ]),
  ],
})
export class ManageQRComponent implements OnInit {

  // ── QR Print Settings ──────────────────────────────────────

  // All margin values derived from published Avery template specs at 96 DPI (1 in = 96 px).
  qrSizes: QRSizeConfig[] = [
    {
      label: 'Select label size',
      avery: '', size: 0, rows: 0, cols: 0,
      labelW: 0, labelH: 0, imgSize: 0,
      marginTop: 0, marginLeft: 0, gapX: 0, gapY: 0,
      showLabel: true, overlayLabel: false,
    },
    {
      // Avery 94106 — 1½" × 1½" square, 20 per sheet (4 cols × 5 rows)
      // Published specs: top/bottom margin 0.625", left/right margin 0.5"
      // H pitch: (8.5 - 2×0.5) / 4 = 1.875" → gapX = 1.875 - 1.5 = 0.375" = 36 px
      // V pitch: (11  - 2×0.625) / 5 = 1.95"  → gapY = 1.95  - 1.5 ≈ 0.45" = 43 px
      label: 'Avery 94106 — 1½×1½", 20 labels (4 cols × 5 rows)',
      avery: '94106',
      size: 144,        // 1.5 in × 96 px/in
      rows: 5, cols: 4,
      labelW: 144, labelH: 144,
      imgSize: 108,     // QR image with ~18 px padding each side
      marginTop: 60,    // 0.625 in × 96 = 60 px
      marginLeft: 48,   // 0.5 in × 96 = 48 px
      gapX: 36,         // 0.375 in = 36 px
      gapY: 43,         // ≈ 0.45 in = 43 px
      showLabel: true, overlayLabel: false,
    },
    {
      // Avery 22807 — 2" × 2" square, 12 per sheet (3 cols × 4 rows)
      // Published specs: left margin 0.75", top margin 0.5", pitch 2.625" H & V
      label: 'Avery 22807 — 2×2", 12 labels (3 cols × 4 rows)',
      avery: '22807',
      size: 192,
      rows: 4, cols: 3,
      labelW: 192, labelH: 192,
      imgSize: 150,
      marginTop: 48,    // 0.5 in
      marginLeft: 72,   // 0.75 in
      gapX: 60,         // 2.625 in pitch − 2 in label = 0.625 in ≈ 60 px
      gapY: 60,
      showLabel: true, overlayLabel: false,
    },
    {
      // Avery 94107 — 2" × 2" square, 12 per sheet (3 cols × 4 rows) — Presta print-to-edge
      // Same sheet footprint as 22807 but with a slightly different vertical pitch.
      // Published specs: left margin 0.75", top margin 0.5", H pitch 2.625"
      // V pitch derived from sheet math:
      //   Usable height = 11" − 2×0.5" = 10"
      //   4 rows of 2" = 8"; remaining 2" spread across 3 inter-row gaps
      //   Per gap = 2" / 3 ≈ 0.667" ≈ 64 px
      label: 'Avery 94107 — 2×2", 12 labels (3 cols × 4 rows) — Presta print-to-edge',
      avery: '94107',
      size: 192,
      rows: 4, cols: 3,
      labelW: 192, labelH: 192,
      imgSize: 150,
      marginTop: 48,    // 0.5 in × 96 = 48 px
      marginLeft: 72,   // 0.75 in × 96 = 72 px
      gapX: 60,         // 2.625 in pitch − 2 in label = 0.625 in = 60 px
      gapY: 64,         // ≈ 0.667 in = 64 px (use fine-tune panel if misaligned)
      showLabel: true, overlayLabel: false,
    },
    {
      // SpartanIndustrial S002 — 2" × 2" square, 20 per sheet (4 cols × 5 rows)
      // Print-to-edge layout — labels butt directly against each other, no inter-label gap.
      // Sheet math at 96 DPI:
      //   H: 4 cols × 2" = 8"; leftover = 0.5" → left margin 0.25" (24 px); gapX = 0
      //   V: 5 rows × 2" = 10"; leftover = 1.0" → top margin 0.5"  (48 px); gapY = 0
      // imgSize 185 fills nearly the full 192 px label (~3-4 px each side) — matches
      // the client-supplied reference sheet where QR fills the label edge-to-edge.
      // showLabel: false — Spartan template has NO restaurant name text below the QR.
      label: 'Spartan S002 — 2×2", 20 labels (4 cols × 5 rows) — print-to-edge',
      avery: 'S002',
      size: 192,
      rows: 5, cols: 4,
      labelW: 192, labelH: 192,
      imgSize: 192,     // full bleed — QR fills entire label, no side padding = no inter-label gap
      marginTop: 48,    // 0.5 in × 96 = 48 px
      marginLeft: 24,   // 0.25 in × 96 = 24 px
      gapX: 0,          // print-to-edge — labels touch horizontally
      gapY: 0,          // print-to-edge — labels touch vertically
      showLabel: true,  // name rendered as overlay strip at bottom of QR
      overlayLabel: true, // name overlaid on QR bottom — avoids adding height outside label
    },
    {
      // Avery 22830 — 3" × 3" square, 6 per sheet (2 cols × 3 rows)
      // Published specs: left margin 1.25", top margin 1", pitch 4.25" H, 3.33" V
      label: 'Avery 22830 — 3×3", 6 labels (2 cols × 3 rows)',
      avery: '22830',
      size: 288,
      rows: 3, cols: 2,
      labelW: 288, labelH: 288,
      imgSize: 240,
      marginTop: 96,    // 1 in
      marginLeft: 120,  // 1.25 in
      gapX: 120,        // 4.25 in pitch − 3 in label = 1.25 in = 120 px
      gapY: 32,         // 3.33 in pitch − 3 in label = 0.33 in ≈ 32 px
      showLabel: true, overlayLabel: false,
    },
  ];

  // selectedQRSize holds the Avery product number string ('' = none selected)
  selectedQRSize: string = '';

  // Margin fields — loaded from preset on size change, user can override
  extraMarginTop: number = 0;
  extraMarginLeft: number = 0;
  extraMarginBetween: number = 0;
  numberOfQRCopies: number = 1;

  // ── General State ──────────────────────────────────────────

  selectedOption: string | null = null;
  restaurantname?: string = '';
  restaurantId!: number;
  SingleqrData: string = '';
  showQRPopup: boolean = false;

  // ── Loading States ─────────────────────────────────────────

  isPrinting: boolean = false;
  isDownloading: boolean = false;

  // ── Custom QR State ────────────────────────────────────────

  editingQRId: number | null = null;
  showCustomQRModal: boolean = false;
  requestTypes: RequestType[] = [];
  customQRForm: CustomQRForm = {
    requestTypeId: null,
    description: '',
    isRestaurantInfo: false,
  };
  isLoadingRequestTypes: boolean = false;
  isSavingCustomQR: boolean = false;
  customQRError: string = '';
  customQRSuccess: boolean = false;
  generatedCustomQRData: string = '';
  generatedCustomQRId: number = 0;

  // ── Constructor ────────────────────────────────────────────

  constructor(
    private router: Router,
    private snackBar: MatSnackBar,
    private qrService: RestaurantService,
    private session: SessionService,
    @Inject(PLATFORM_ID) private platformId: Object,
  ) {}

  ngOnInit(): void {
    this.initializeComponent();
  }

  // ── Initialisation ─────────────────────────────────────────

  private initializeComponent(): void {
    this.restaurantname = this.session.getItem('restaurantName') ?? undefined;
    this.restaurantId = this.session.getNumber('restaurantId');
  }

  // ── Card Selection ─────────────────────────────────────────

  selectOption(option: string): void {
    this.selectedOption = option;
  }

  // ── Restaurant-Wide QR ─────────────────────────────────────

  showQRCodePopup(): void {
    this.showQRPopup = true;
    this.generateSingleQRCode();
  }

  private generateSingleQRCode(): void {
    this.restaurantname = this.session.getItem('restaurantName') ?? this.restaurantname;
    this.restaurantId = this.session.getNumber('restaurantId') || this.restaurantId;
    const encoded = btoa(`${this.restaurantId}|0|${this.restaurantname}|RestApp|1`);
    this.SingleqrData = `https://web.tablesignals.com/open?data=${encoded}`;
  }

  closeSingleQRCodePopup(): void {
    this.showQRPopup = false;
  }

  // ── Download QR ────────────────────────────────────────────

  downloadQRCode(): void {
    this.isDownloading = true;

    // Small delay lets Angular render the spinner/disabled state
    // before the synchronous canvas work blocks the thread
    setTimeout(() => {
      const qrElement = document.querySelector('.qr-code-container qr-code canvas');
      if (qrElement && qrElement instanceof HTMLCanvasElement) {
        const url = qrElement.toDataURL('image/png');
        const link = document.createElement('a');
        link.href = url;
        link.download = `restaurant-${this.restaurantId}-qr.png`;
        link.click();
        this.snackBar.open('QR Code downloaded!', 'Close', { duration: 3000 });
      } else {
        this.snackBar.open('QR code not found. Please try again.', 'Close', { duration: 3000 });
      }
      this.isDownloading = false;
    }, 50);
  }

  // ── Print: size change ─────────────────────────────────────

  /**
   * Called when the label sheet dropdown changes.
   * Pre-fills margin fields from the Avery spec so the user sees correct
   * values immediately — they can still override via the Adjust Margins panel.
   */
  onQRSizeChange(): void {
    const layout = this.qrSizes.find(s => s.avery === this.selectedQRSize);
    if (!layout?.avery) return;
    this.extraMarginTop = layout.marginTop;
    this.extraMarginLeft = layout.marginLeft;
    this.extraMarginBetween = 0;
  }

  /** Returns the full config object for the currently selected Avery size, or null. */
  get selectedLayout(): QRSizeConfig | null {
    return this.qrSizes.find(s => s.avery === this.selectedQRSize) ?? null;
  }

  /** Returns a zero-filled array of length n — used by *ngFor to render dot grids. */
  getDotArray(n: number): number[] {
    return Array(n).fill(0);
  }

  incrementCopies(): void {
    if (this.numberOfQRCopies < 500) this.numberOfQRCopies++;
  }

  decrementCopies(): void {
    if (this.numberOfQRCopies > 1) this.numberOfQRCopies--;
  }

  getPageInfo(): string {
    const layout = this.selectedLayout;
    if (!layout) return '';
    const codesPerPage = layout.rows * layout.cols;
    const totalPages = Math.ceil(this.numberOfQRCopies / codesPerPage);
    return `${totalPages} page${totalPages > 1 ? 's' : ''}`;
  }

  // ── Print: generate print window ──────────────────────────

  printRestaurantQR(): void {
    const layout = this.qrSizes.find(s => s.avery === this.selectedQRSize);

    if (!layout?.avery) {
      this.snackBar.open('Please select a label sheet size', 'Close', { duration: 3000 });
      return;
    }

    if (this.numberOfQRCopies < 1) {
      this.snackBar.open('Please enter at least 1 QR copy', 'Close', { duration: 3000 });
      return;
    }

    const qrCanvas = document.querySelector(
      '.qr-code-container qr-code canvas'
    ) as HTMLCanvasElement;

    if (!qrCanvas) {
      this.snackBar.open('QR code not found. Please try again.', 'Close', { duration: 3000 });
      return;
    }

    // Show spinner — the 50 ms timeout lets Angular render the loading state
    // before the heavy synchronous canvas/iframe work blocks the thread
    this.isPrinting = true;

    setTimeout(() => {
      const qrImageData = qrCanvas.toDataURL('image/png');

      // ── Layout constants ───────────────────────────────────
      // Page size: 8.5" × 11" at 96 DPI = 816 × 1056 px
      const PAGE_W = 816;
      const PAGE_H = 1056;

      const { rows, cols, labelW, labelH, imgSize, showLabel, overlayLabel } = layout;

      // User can nudge margins via the "Adjust Margins" panel;
      // extraMarginBetween adds to both gapX and gapY uniformly.
      const marginTop  = this.extraMarginTop;
      const marginLeft = this.extraMarginLeft;
      const gapX       = layout.gapX + this.extraMarginBetween;
      const gapY       = layout.gapY + this.extraMarginBetween;

      const codesPerPage = rows * cols;
      const totalCopies  = this.numberOfQRCopies;
      const totalPages   = Math.ceil(totalCopies / codesPerPage);

      // ── Build pages ────────────────────────────────────────
      let allPagesContent = '';
      let qrsPrinted = 0;

      for (let page = 0; page < totalPages; page++) {
        let labels = '';

        for (let i = 0; i < codesPerPage; i++) {
          if (qrsPrinted >= totalCopies) break;

          const row = Math.floor(i / cols);
          const col = i % cols;

          // Absolute position: top-left corner of each label cell
          const top  = marginTop  + row * (labelH + gapY);
          const left = marginLeft + col * (labelW + gapX);

          labels += `
            <div style="
              position:absolute;
              top:${top}px;
              left:${left}px;
              width:${labelW}px;
              height:${labelH}px;
              box-sizing:border-box;
              overflow:hidden;
            ">
              <img src="${qrImageData}"
                   style="width:${imgSize}px;height:${imgSize}px;display:block;" />
              ${showLabel && !overlayLabel
                ? `<div style="font-size:9px;margin-top:3px;text-align:center;line-height:1.2;">${this.restaurantname}</div>`
                : ''}
              ${showLabel && overlayLabel
                ? `<div style="
                    position:absolute;
                    bottom:0;left:0;right:0;
                    background:rgba(255,255,255,0.82);
                    font-size:9px;
                    text-align:center;
                    padding:2px 0 3px;
                    line-height:1.2;
                  ">${this.restaurantname}</div>`
                : ''}
            </div>`;

          qrsPrinted++;
        }

        const pageBreak = page < totalPages - 1
          ? 'page-break-after:always;'
          : '';

        // Each page is a fixed 8.5"×11" container; labels sit inside it absolutely
        allPagesContent += `
          <div style="
            position:relative;
            width:${PAGE_W}px;
            height:${PAGE_H}px;
            ${pageBreak}
            overflow:hidden;
          ">${labels}</div>`;
      }

      if (!isPlatformBrowser(this.platformId)) {
        this.isPrinting = false;
        return;
      }

      // ── Hidden iframe — no popup, no freeze ────────────────
      // Replaces window.open() so the print dialog opens directly
      // over the current page. The main app stays fully interactive.

      const existing = document.getElementById('qr-print-frame');
      if (existing) existing.remove();

      const iframe = document.createElement('iframe');
      iframe.id = 'qr-print-frame';
      iframe.style.cssText =
        'position:fixed;top:-9999px;left:-9999px;width:0;height:0;border:none;visibility:hidden;';
      document.body.appendChild(iframe);

      const iframeDoc = iframe.contentWindow?.document;
      if (!iframeDoc) {
        this.isPrinting = false;
        return;
      }

      iframeDoc.open();
      iframeDoc.write(`<html><head><style>
        @page { size:letter; margin:0; }
        * { margin:0; padding:0; box-sizing:border-box; }
        body { background:#fff; margin:0; padding:0; }
        @media print { body { margin:0; padding:0; } }
      </style></head><body>${allPagesContent}</body></html>`);
      iframeDoc.close();

      iframe.onload = () => {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
        setTimeout(() => {
          iframe.remove();
          this.isPrinting = false;  // hide spinner after print dialog opens
        }, 1000);
      };
    }, 50);
  }

  // ── Table QR ───────────────────────────────────────────────

  handleTableQR(): void {
    this.router.navigate(['/qrgenerator']);
  }

  // ── VIP QR ─────────────────────────────────────────────────

  handleVipQR(): void {
    this.restaurantname = this.session.getItem('restaurantName') ?? this.restaurantname;
    this.restaurantId = this.session.getNumber('restaurantId') || this.restaurantId;
    const encoded = btoa(`${this.restaurantId}|0|${this.restaurantname}|RestApp|3`);
    this.SingleqrData = `https://web.tablesignals.com/open?data=${encoded}`;
    this.showQRPopup = true;
  }

  // ── Custom QR ──────────────────────────────────────────────

  handleCustomQR(): void {
    this.resetCustomQRForm();
    this.showCustomQRModal = true;
    this.loadRequestTypes();
  }

  private loadRequestTypes(): void {
    this.isLoadingRequestTypes = true;
    this.customQRError = '';

    this.qrService.getRequestTypesForQR(this.restaurantId).subscribe({
      next: (response: RequestType[]) => {
        this.requestTypes = response;
        this.isLoadingRequestTypes = false;
      },
      error: () => {
        this.customQRError = 'Failed to load request types. Please try again.';
        this.isLoadingRequestTypes = false;
      },
    });
  }

  onRequestTypeChange(selectedTypeId: number | null): void {
    if (!selectedTypeId) {
      this.customQRForm.description = '';
      this.customQRForm.isRestaurantInfo = false;
      return;
    }
    const selectedType = this.requestTypes.find(
      type => type.requestTypeID === selectedTypeId
    );
    if (selectedType) {
      this.customQRForm.description = selectedType.description || '';
      this.customQRForm.isRestaurantInfo = selectedType.isRestaurantInfo;
    }
  }

  isDescriptionDisabled(): boolean {
    return !this.customQRForm.isRestaurantInfo;
  }

  isDescriptionInvalid(): boolean {
    if (!this.customQRForm.isRestaurantInfo) return false;
    return this.customQRForm.description.trim() === '';
  }

  private validateCustomQRForm(): boolean {
    this.customQRError = '';
    if (!this.customQRForm.requestTypeId) {
      this.customQRError = 'Please select a request type';
      return false;
    }
    if (this.customQRForm.isRestaurantInfo && this.customQRForm.description.trim() === '') {
      this.customQRError = 'Description is required when Restaurant Info is selected';
      return false;
    }
    return true;
  }

  saveCustomQR(): void {
    if (!this.validateCustomQRForm()) return;

    this.isSavingCustomQR = true;
    this.customQRError = '';

    const payload = {
      restaurantId: this.restaurantId,
      requestTypeId: this.customQRForm.requestTypeId,
      description: this.customQRForm.isRestaurantInfo ? this.customQRForm.description : '',
      isRestaurantInfo: this.customQRForm.isRestaurantInfo,
      qrId: this.editingQRId || undefined,
    };

    this.qrService.saveQRInfo(payload).subscribe({
      next: (response: SaveQRResponse) => {
        if (this.editingQRId) {
          const index = this.requestTypes.findIndex(t => t.qrId === this.editingQRId);
          if (index > -1) {
            this.requestTypes[index].description = this.customQRForm.description;
            this.requestTypes[index].isRestaurantInfo = this.customQRForm.isRestaurantInfo;
          }
          this.snackBar.open('QR updated successfully!', 'Close', { duration: 3000 });
          this.cancelEditQR();
        } else {
          this.generateCustomQRCode(response.qrId);
          this.customQRSuccess = true;
          this.snackBar.open('Custom QR generated successfully!', 'Close', { duration: 3000 });
        }
        this.isSavingCustomQR = false;
      },
      error: (error) => {
        this.customQRError = error?.error?.message || 'Failed to save QR. Please try again.';
        this.isSavingCustomQR = false;
      },
    });
  }

  generateQRFromList(requestType: RequestType): void {
    if (!requestType) return;

    this.isSavingCustomQR = true;
    this.customQRError = '';

    const payload = {
      restaurantId: this.restaurantId,
      requestTypeId: requestType.requestTypeID,
      description: requestType.description || '',
      isRestaurantInfo: requestType.isRestaurantInfo,
    };

    this.qrService.saveQRInfo(payload).subscribe({
      next: (response: SaveQRResponse) => {
        this.generateCustomQRCode(response.qrId);
        this.customQRSuccess = true;
        this.snackBar.open('Custom QR generated successfully!', 'Close', { duration: 3000 });
        this.isSavingCustomQR = false;
      },
      error: (error) => {
        this.customQRError = error?.error?.message || 'Failed to save QR. Please try again.';
        this.isSavingCustomQR = false;
      },
    });
  }

  startEditQR(type: RequestType): void {
    this.editingQRId = type.qrId;
    this.customQRForm.requestTypeId = type.requestTypeID;
    this.customQRForm.description = type.description || '';
    this.customQRForm.isRestaurantInfo = type.isRestaurantInfo;
  }

  cancelEditQR(): void {
    this.editingQRId = null;
    this.resetCustomQRForm();
  }

  deleteQR(type: RequestType): void {
    if (!confirm(`Are you sure you want to delete QR "${type.requestName}"?`)) return;
    this.isSavingCustomQR = true;
    this.customQRError = '';
    // TODO: wire up delete API call here
    // Remember to set this.isSavingCustomQR = false in both success and error handlers
  }

  get generatedRequestTypes(): RequestType[] {
    return this.requestTypes.filter(type => type.qrId > 0);
  }

  private generateCustomQRCode(qrId: number): void {
    this.generatedCustomQRId = qrId;
    this.restaurantname = this.session.getItem('restaurantName')?.toString();
    const flag = this.customQRForm.isRestaurantInfo ? 4 : 5;
    const encoded = btoa(`${this.restaurantId}|${qrId}|${this.restaurantname}|RestApp|${flag}`);
    this.generatedCustomQRData = `https://web.tablesignals.com/open?data=${encoded}`;
  }

  downloadCustomQRCode(): void {
    this.isDownloading = true;

    setTimeout(() => {
      const qrElement = document.querySelector('.custom-qr-code-container qr-code canvas');
      if (qrElement && qrElement instanceof HTMLCanvasElement) {
        const url = qrElement.toDataURL('image/png');
        const link = document.createElement('a');
        link.href = url;
        link.download = `custom-qr-${this.generatedCustomQRId}.png`;
        link.click();
        this.snackBar.open('Custom QR Code downloaded!', 'Close', { duration: 3000 });
      } else {
        this.snackBar.open('QR code not found. Please try again.', 'Close', { duration: 3000 });
      }
      this.isDownloading = false;
    }, 50);
  }

  public resetCustomQRForm(): void {
    this.customQRForm = { requestTypeId: null, description: '', isRestaurantInfo: false };
    this.customQRError = '';
    this.customQRSuccess = false;
    this.generatedCustomQRData = '';
    this.generatedCustomQRId = 0;
  }

  closeCustomQRModal(): void {
    this.showCustomQRModal = false;
    this.resetCustomQRForm();
  }

  trackByRequestTypeId(_: number, type: RequestType): number {
    return type.requestTypeID;
  }
}