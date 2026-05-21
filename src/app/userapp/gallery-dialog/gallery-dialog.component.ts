import { CommonModule } from '@angular/common';
import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { SessionService } from '../../Services/session.service';

@Component({
   standalone: true,
    imports: [CommonModule,
      MatDialogModule
          
    ],
  selector: 'app-gallery-dialog',
  templateUrl: './gallery-dialog.component.html',
  styleUrls: ['./gallery-dialog.component.scss']
  
})
export class GalleryDialogComponent {
  currentIndex: number = 0;
  zoomLevel: number = 1;
  restaurantId = 4; // Set dynamically based on logged-in user
  
  showZoomedImg: string | null = null; // To show zoomed image
  isBrowser: boolean = false;
  constructor(
    public dialogRef: MatDialogRef<GalleryDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { images: string[], index: number },
    private session: SessionService
  ) {
    this.restaurantId = this.session.getNumber('restaurantId', 4);
    this.currentIndex = data.index;
  }

  nextImage() {
    if (this.currentIndex < this.data.images.length - 1) {
      this.currentIndex++;
    }
  }

  prevImage() {
    if (this.currentIndex > 0) {
      this.currentIndex--;
    }
  }

  zoomIn() {
    this.zoomLevel += 0.2;
  }

  zoomOut() {
    if (this.zoomLevel > 0.5) {
      this.zoomLevel -= 0.2;
    }
  }

  closeDialog() {
    this.dialogRef.close();
  }
}
