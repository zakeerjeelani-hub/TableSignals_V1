import { ChangeDetectorRef, Component, Inject, PLATFORM_ID } from '@angular/core';
import { RestaurantService } from '../../Services/restaurant.service';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { LeftMenuComponent } from '../../layout/left-menu/left-menu.component';
import { TopMenuComponent } from '../../layout/top-menu/top-menu.component';

import { GalleryDialogComponent } from '../../userapp/gallery-dialog/gallery-dialog.component';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute, Router } from '@angular/router';
interface MenuImage {
  imageUrl: string;
}
@Component({
  selector: 'app-showmenu',
  standalone: true,
  imports: [CommonModule,
        // LeftMenuComponent,
        // TopMenuComponent,
  ],
  templateUrl: './showmenu.component.html',
  styleUrl: './showmenu.component.scss'
})
export class ShowmenuComponent {

  menuImages: string[] = [];
  restaurantId = 4; // Set dynamically based on logged-in user
  isBrowser: boolean = false;
  tableid:any;
  restaurantname:any;
  constructor(private rout: ActivatedRoute, private menuService: RestaurantService, public dialog: MatDialog, @Inject(PLATFORM_ID) private platformId: Object,
        private cdr: ChangeDetectorRef,private router: Router) {
    
            if (isPlatformBrowser(this.platformId)) {

              this.rout.queryParams.subscribe(params => {
                this.restaurantId = params['restaurantid']?params['restaurantid']:1;
                
      this.tableid = params['tableid']?params['tableid']:1;
      this.restaurantname = params['restaurantname']?params['restaurantname']:1;
                
            });
          

            }
            this.isBrowser = isPlatformBrowser(this.platformId);
  }

  ngOnInit() {
    this.fetchMenuImages();
  }

  fetchMenuImages() {
    this.menuService.getMenuImages(this.restaurantId).subscribe(
      response => {
        this.menuImages = response.images.map((img: MenuImage) => "https://api.tablesignals.com/images/TSImages/images/"+this.restaurantId+"/"+img.imageUrl);
      },
      error => {
        console.error('Error fetching menu images:', error);
      }
    );
  }

  Back() :void
  {
    this.router.navigate(['/open1'],{
      queryParams: {
        restaurantid: this.restaurantId,
        tableid:this.tableid,
        restaurantname:this.restaurantname
      },
    });
  }
  openGallery(index: number) {
    this.dialog.open(GalleryDialogComponent, {
      data: { images: this.menuImages, index },
      width: '150vw',
      height: '150vh'
    });
  }
}