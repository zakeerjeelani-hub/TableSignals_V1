import { isPlatformBrowser } from '@angular/common';
import { AfterViewInit, Component, Inject, Input, PLATFORM_ID } from '@angular/core';
declare global {
  interface Window {
    adsbygoogle: any[];
  }
}

@Component({
  selector: 'app-adsense',
  standalone: true,
  imports: [],
  templateUrl: './adsense.component.html',
  styleUrl: './adsense.component.scss'
})
export class AdsenseComponent implements AfterViewInit {

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {}
  @Input() adClient!: string;
  @Input() adSlot!: string;

  ngAfterViewInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      //debugger
    try {
      (window['adsbygoogle'] = window['adsbygoogle'] || []).push({});
    } catch (e) {
      console.error('AdSense error:', e);
    }
  }
  
  }
  
}
