import { CommonModule } from '@angular/common';

import { Router, RouterOutlet,ActivatedRoute } from '@angular/router';
import { Component, Inject, OnInit, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { QrCodeModule } from 'ng-qrcode';

@Component({
  selector: 'app-qrgenerator',
  standalone: true,
  imports: [CommonModule,QrCodeModule],
  templateUrl: './qrgenerator.component.html',
  styleUrl: './qrgenerator.component.scss'
})
export class QRGeneratorComponent  {
  isAndroid = false;
  isIOS = false;

  androidAppLink = 'https://play.google.com/store/apps/details?id=com.rattletech.tablesignalsalerts'; // Replace with your app's Play Store URL
    iosAppLink = 'https://apps.apple.com/in/app/table-signals-alerts/id6738416576'; // Replace with your app's App Store URL
  
    constructor(@Inject(PLATFORM_ID) private platformId: Object,public router:Router,private rout: ActivatedRoute,) {
      if (isPlatformBrowser(this.platformId)) {
   
        const userAgent = navigator.userAgent || navigator.vendor;
    
        this.isAndroid = /android/i.test(userAgent);
        this.isIOS = /iPad|iPhone|iPod/.test(userAgent);

        if(this.isIOS)
        {
          window.location.href = this.iosAppLink;
        }
        if(this.isAndroid)
          {
            window.location.href = this.androidAppLink;
          }
        }   
      }
      
}
