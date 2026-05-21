import { CommonModule } from '@angular/common';

import { Router, RouterOutlet,ActivatedRoute } from '@angular/router';
import { Component, Inject, OnInit, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { RestaurantService } from '../../Services/restaurant.service';

@Component({
  selector: 'app-verify-email',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './verify-email.component.html',
  styleUrl: './verify-email.component.scss'
})
export class VerifyEmailComponent implements OnInit {
   isAndroid = false;
    isIOS = false;
    // androidAppLink:string=''
    // iosAppLink:string=''
    androidAppLink = 'https://play.google.com/store/apps/details?id=com.rattletech.tablesignalsalerts'; // Replace with your app's Play Store URL
    iosAppLink = 'https://apps.apple.com/in/app/table-signals-alerts/id6738416576'; // Replace with your app's App Store URL
    verificationId:any;
    
    constructor(@Inject(PLATFORM_ID) private platformId: Object,public router:Router,private rout: ActivatedRoute,public service:RestaurantService,) {
      
    if (isPlatformBrowser(this.platformId)) {
      this.rout.queryParams.subscribe(params => {
        this.verificationId = params['verificationId']?params['verificationId']:1;
 
    });
  }
    }


  ngOnInit(): void {
  
    if (isPlatformBrowser(this.platformId)) {
   


      this.service.VerifyRestaurant(this.verificationId).subscribe(
        response => {
      
        },
        error => {
      
      
        }
      );

    const userAgent = navigator.userAgent || navigator.vendor;

    this.isAndroid = /android/i.test(userAgent);
    this.isIOS = /iPad|iPhone|iPod/.test(userAgent);
    } 
  }
  continueInBrowser(): void {
    this.router.navigate(['/login']);
    // Optionally, you can perform additional actions like logging or redirecting.
  }
}