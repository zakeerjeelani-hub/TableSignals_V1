import { CommonModule } from '@angular/common';
import { Component, Input} from '@angular/core';

@Component({
  selector: 'app-success-message',
  templateUrl: './success-message.component.html',
  styleUrls: ['./success-message.component.scss'],
  standalone: true,  // Mark the component as standalone
  imports:[CommonModule]
})
export class SuccessMessageComponent {
  visible: boolean = true;
@Input() message: string = 'Operation successful!';


  closeMessage(): void {
    this.visible = false;
  }

  showMessage(): void {
    this.visible = true;
  }
}
