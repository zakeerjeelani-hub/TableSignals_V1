import { Component, OnInit, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

@Component({
  selector: 'app-google-translate',
  templateUrl: './google-translate.component.html',
  styleUrl: './google-translate.component.scss',
  standalone:true
})
export class GoogleTranslateComponent implements OnInit {
  constructor(@Inject(PLATFORM_ID) private platformId: Object) {}

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.loadGoogleTranslateScript();
    }
  }

  loadGoogleTranslateScript(): void {
    if (!document.getElementById('google-translate-script')) {
      const script = document.createElement('script');
      script.id = 'google-translate-script';
      script.src =
        'https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
      script.async = true;
      document.body.appendChild(script);

      (window as any).googleTranslateElementInit = this.googleTranslateElementInit;
    } else {
      this.googleTranslateElementInit();
    }
  }

  
  googleTranslateElementInit(): void {
    new (window as any).google.translate.TranslateElement(
      {
        pageLanguage: 'en',
        includedLanguages: 'en,es,zh-CN,t1,vi,fr,ko,ar,de,ru,pt,it,ht,hi', // Restrict to these 10 languages
        layout: (window as any).google.translate.TranslateElement.InlineLayout.SIMPLE,
      },
      'google_translate_element'
    );
  
    // Prevent Angular Router from intercepting events
    const translateDiv = document.getElementById('google_translate_element');
    if (translateDiv) {
      translateDiv.addEventListener('click', (event) => {
        event.stopPropagation();
        event.preventDefault();
      });
    }
  }
  
}
