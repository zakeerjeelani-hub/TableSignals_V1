import { Component } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { MatCard, MatCardTitle } from '@angular/material/card';
import { MatFormField, MatLabel } from '@angular/material/form-field';
import { MatIcon } from '@angular/material/icon';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [MatFormField,MatLabel,MatIcon,MatCard,MatCardTitle],
  templateUrl: './register.component.html',
  styleUrl: './register.component.scss'
})
export class RegisterComponent {
hidePassword:any;
registerForm:FormGroup;
constructor(public fb:FormBuilder)
{
  this.registerForm = this.fb.group({
      restaurantId:[0],
      restaurantName: ['',],
      emailID: ['',],
      userName: [''],
      password: ['',],
      
})}
}
