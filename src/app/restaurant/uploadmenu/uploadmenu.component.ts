import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  Inject,
  OnInit,
  PLATFORM_ID
} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTooltipModule } from '@angular/material/tooltip';

import { RestaurantService } from '../../Services/restaurant.service';
import { BackButtonComponent } from '../../common/back-button/back-button.component';
import { SessionService } from '../../Services/session.service';

// ============================================
// INTERFACES
// ============================================

interface MenuImage {
  imageUrl: string;
}

interface ImagePreview {
  base64: string;
  preview: string;
  name: string;
}

// ============================================
// COMPONENT
// ============================================

@Component({
  selector: 'app-uploadmenu',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    MatButtonModule,
    MatProgressBarModule,
    MatTooltipModule,
    BackButtonComponent
  ],
  templateUrl: './uploadmenu.component.html',
  styleUrl: './uploadmenu.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class UploadmenuComponent implements OnInit {
  // ============================================
  // STATE
  // ============================================
  selectedFiles: File[] = [];
  selectedImages: ImagePreview[] = [];
  uploadedImages: string[] = [];
  selectedToDelete: Set<string> = new Set();
  
  restaurantId = 0;
  zoomLevel: number = 1;
  showZoomedImg: string | null = null;
  
  isLoading = false;
  isUploading = false;
  isDeleting = false;
  isBrowser = false;
  
  uploadProgress = 0;
  errorMessage = '';
  successMessage = '';

  // ============================================
  // CONSTRUCTOR
  // ============================================
  constructor(
    private router: Router,
    private menuService: RestaurantService,
    private cdr: ChangeDetectorRef,
    private session: SessionService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(this.platformId);
    
    if (this.isBrowser) {
      const storedId = this.session.getItem('restaurantId');
      this.restaurantId = storedId ? parseInt(storedId, 10) : 0;
      
      if (this.restaurantId === 0) {
        this.router.navigate(['/login']);
      }
    }
  }

  // ============================================
  // LIFECYCLE
  // ============================================
  ngOnInit(): void {
    this.fetchUploadedImages();
  }

  // ============================================
  // FILE HANDLING
  // ============================================

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    
    if (!input.files || input.files.length === 0) {
      return;
    }

    this.selectedFiles = Array.from(input.files);
    this.selectedImages = [];
    this.errorMessage = '';

    // Validate files
    const invalidFiles = this.selectedFiles.filter(file => {
      if (!file.type.startsWith('image/')) {
        return true;
      }
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        return true;
      }
      return false;
    });

    if (invalidFiles.length > 0) {
      this.errorMessage = 'Some files are invalid (must be images, max 5MB each)';
      this.cdr.markForCheck();
      return;
    }

    // Process valid files
    let processedCount = 0;
    for (const file of this.selectedFiles) {
      const reader = new FileReader();
      
      reader.onload = () => {
        const result = reader.result as string;
        const base64 = result.split(',')[1];
        
        this.selectedImages.push({
          base64,
          preview: result,
          name: file.name
        });
        
        processedCount++;
        if (processedCount === this.selectedFiles.length) {
          this.cdr.markForCheck();
        }
      };
      
      reader.onerror = () => {
        this.errorMessage = `Failed to read file: ${file.name}`;
        this.cdr.markForCheck();
      };
      
      reader.readAsDataURL(file);
    }
  }

  // ============================================
  // UPLOAD METHODS
  // ============================================

  uploadImages(): void {
    if (this.selectedImages.length === 0) {
      this.errorMessage = 'Please select images before uploading.';
      this.cdr.markForCheck();
      return;
    }

    if (this.restaurantId === 0) {
      this.errorMessage = 'Restaurant ID not found. Please login again.';
      this.cdr.markForCheck();
      return;
    }

    this.isUploading = true;
    this.errorMessage = '';
    this.successMessage = '';
    this.uploadProgress = 0;
    this.cdr.markForCheck();

    const base64Images = this.selectedImages.map(img => img.base64);

    this.menuService.uploadMenuImages(this.restaurantId, base64Images).subscribe({
      next: (response) => {
        this.successMessage = `Successfully uploaded ${this.selectedImages.length} image(s)!`;
        this.selectedFiles = [];
        this.selectedImages = [];
        this.uploadProgress = 0;
        this.isUploading = false;
        
        const fileInput = document.getElementById('fileUpload') as HTMLInputElement;
        if (fileInput) {
          fileInput.value = '';
        }
        
        this.fetchUploadedImages();
        this.clearMessages();
        this.cdr.markForCheck();
      },
      error: (error) => {
        console.error('Upload error:', error);
        this.errorMessage = 'Failed to upload images. Please try again.';
        this.isUploading = false;
        this.uploadProgress = 0;
        this.cdr.markForCheck();
      }
    });
  }

  // ============================================
  // IMAGE MANAGEMENT
  // ============================================

  fetchUploadedImages(): void {
    if (this.restaurantId === 0) {
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    this.cdr.markForCheck();

    this.menuService.getMenuImages(this.restaurantId).subscribe({
      next: (response) => {
        this.uploadedImages = (response.images || []).map(
          (img: MenuImage) =>
            `https://api.tablesignals.com/images/TSImages/images/${this.restaurantId}/${img.imageUrl}`
        );
        this.isLoading = false;
        this.cdr.markForCheck();
      },
      error: (error) => {
        console.error('Error fetching uploaded images:', error);

        this.uploadedImages = [];

        if (!this.isMenuImagesNotFoundError(error)) {
          this.errorMessage = 'Failed to load uploaded images.';
        }

        this.isLoading = false;
        this.cdr.markForCheck();
      }
    });
  }

  toggleImageSelection(image: string): void {
    if (this.selectedToDelete.has(image)) {
      this.selectedToDelete.delete(image);
    } else {
      this.selectedToDelete.add(image);
    }
    this.cdr.markForCheck();
  }

  isImageSelected(image: string): boolean {
    return this.selectedToDelete.has(image);
  }

  deleteSelectedImages(): void {
    if (this.selectedToDelete.size === 0) {
      this.errorMessage = 'Please select at least one image to delete.';
      this.cdr.markForCheck();
      return;
    }

    const deleteCount = this.selectedToDelete.size;
    
    if (!confirm(`Are you sure you want to delete ${deleteCount} image(s)?`)) {
      return;
    }

    this.isDeleting = true;
    this.errorMessage = '';
    this.successMessage = '';
    this.cdr.markForCheck();

    const imagesToDelete = Array.from(this.selectedToDelete);

    this.menuService.deleteMenuImages(this.restaurantId, imagesToDelete).subscribe({
      next: (response) => {
        this.successMessage = `Successfully deleted ${deleteCount} image(s)!`;
        this.selectedToDelete.clear();
        this.isDeleting = false;
        
        const fileInput = document.getElementById('fileUpload') as HTMLInputElement;
        if (fileInput) {
          fileInput.value = '';
        }
        
        this.fetchUploadedImages();
        this.clearMessages();
        this.cdr.markForCheck();
      },
      error: (error) => {
        console.error('Error deleting images:', error);
        this.errorMessage = 'Failed to delete images. Please try again.';
        this.isDeleting = false;
        this.cdr.markForCheck();
      }
    });
  }

  // ============================================
  // ZOOM METHODS
  // ============================================

  showZoom(img: string, event: Event): void {
    event.stopPropagation();
    this.showZoomedImg = img;
    this.zoomLevel = 1;
    this.cdr.markForCheck();
  }

  closeZoom(): void {
    this.showZoomedImg = null;
    this.zoomLevel = 1;
    this.cdr.markForCheck();
  }

  // ============================================
  // NAVIGATION
  // ============================================

  goHome(): void {
    this.router.navigate(['/dashboard']);
  }

  // ============================================
  // UTILITIES
  // ============================================

  clearSelectedImages(): void {
    this.selectedImages = [];
    this.selectedFiles = [];
    const fileInput = document.getElementById('fileUpload') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
    this.cdr.markForCheck();
  }

  private isMenuImagesNotFoundError(error: any): boolean {
    return error?.status === 404
      || error?.error?.status === 404
      || error?.error?.title === 'Not Found';
  }

  private clearMessages(): void {
    setTimeout(() => {
      this.successMessage = '';
      this.errorMessage = '';
      this.cdr.markForCheck();
    }, 4000);
  }

  get selectedDeleteCount(): number {
    return this.selectedToDelete.size;
  }
}