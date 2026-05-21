import { CommonModule } from '@angular/common';
import { Component, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-popup-message',
  templateUrl:'./popup-message.component.html',
  styleUrl:'./popup-message.component.scss',
  standalone:true,
  imports:[CommonModule]
})
export class PopupMessageComponent {
  @Input() message: string = '';
  @Input() isVisible: boolean = false;
  @Output() closed = new EventEmitter<void>();

  closePopup() {
    this.isVisible = false;
    this.closed.emit();
  }
}
