import { Component, EventEmitter, Inject, Input, OnInit, Output, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { RestaurantService } from '../../Services/restaurant.service';
import { PopupMessageComponent } from '../../common/popup-message/popup-message.component';

const MAX_PREVIOUS = 5;
const STORAGE_KEY_PREFIX = 'ts_prev_msgs_';

@Component({
  selector: 'app-custom-message',
  standalone: true,
  imports: [CommonModule, FormsModule, PopupMessageComponent],
  templateUrl: './custom-message.component.html',
  styleUrl: './custom-message.component.scss'
})
export class CustomMessageComponent implements OnInit {
  @Input() embedded = false;
  @Output() dismissed = new EventEmitter<void>();

  message = '';
  displayMessage = '';
  popupMessage = '';
  showPopup = false;
  isSending = false;

  previousMessages: string[] = [];

  private restaurantid: any;
  private tableid: any;
  private tableIdFromUrl = false;
  private storageKey = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private service: RestaurantService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      this.restaurantid = params['restaurantid'] ?? null;
      this.tableid = params['tableid'] ?? null;
      this.tableIdFromUrl = !!this.tableid;
      this.storageKey = STORAGE_KEY_PREFIX + (this.restaurantid ?? 'default');
    });

    if (isPlatformBrowser(this.platformId)) {
      this.loadPreviousMessages();
    }
  }

  get charCount(): number {
    return this.message.length;
  }

  fillMessage(text: string): void {
    this.message = text.substring(0, 50);
  }

  saveAndDisplay(): void {
    const trimmed = this.message.trim();
    if (!trimmed) return;
    this.displayMessage = trimmed;
    this.addToPrevious(trimmed);
    this.popupMessage = `Message saved: "${trimmed}"`;
    this.showPopup = true;
  }

  sendMessage(): void {
    const trimmed = this.message.trim();
    if (!trimmed || this.isSending) return;

    this.isSending = true;
    const d = new Date();

    const onSuccess = () => {
      this.addToPrevious(trimmed);
      this.popupMessage = 'Message sent! Your server has been notified.';
      this.showPopup = true;
      this.message = '';
      this.isSending = false;
    };

    const onError = () => {
      this.popupMessage = 'Failed to send message. Please try again.';
      this.showPopup = true;
      this.isSending = false;
    };

    if (this.tableIdFromUrl) {
      this.service.TSUserRequest({
        requestTypeID: 9,
        userDeviceID: 'abc',
        tableID: this.tableid,
        restaurantID: this.restaurantid,
        requestTime: d,
        customDescription: trimmed
      }).subscribe({ next: onSuccess, error: onError });
    } else {
      this.service.TSUserRequestByTableNo({
        requestTypeID: 9,
        userDeviceID: 'abc',
        tableNo: Number(this.tableid) || 0,
        restaurantID: Number(this.restaurantid),
        requestTime: d,
        customDescription: trimmed
      }).subscribe({ next: onSuccess, error: onError });
    }
  }

  goBack(): void {
    if (this.embedded) {
      this.dismissed.emit();
      return;
    }
    this.router.navigate(['/open2'], { queryParamsHandling: 'preserve' });
  }

  closePopup(): void {
    this.showPopup = false;
  }

  private addToPrevious(text: string): void {
    this.previousMessages = [
      text,
      ...this.previousMessages.filter(m => m !== text)
    ].slice(0, MAX_PREVIOUS);

    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem(this.storageKey, JSON.stringify(this.previousMessages));
    }
  }

  private loadPreviousMessages(): void {
    try {
      const stored = localStorage.getItem(this.storageKey);
      this.previousMessages = stored ? JSON.parse(stored) : [];
    } catch {
      this.previousMessages = [];
    }
  }
}
