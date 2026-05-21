import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-errormessage',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './errormessage.component.html',
  styleUrl: './errormessage.component.scss'
})
export class ErrormessageComponent {

  errorvisible: boolean = true;
@Input() message: string = 'Operation successful!';


  closeMessage(): void {
    this.errorvisible = false;
  }

  showMessage(): void {
    this.errorvisible = true;
  }
}
