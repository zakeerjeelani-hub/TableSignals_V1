import { Component } from '@angular/core';
import { LeftMenuComponent } from '../../layout/left-menu/left-menu.component';
import { TopMenuComponent } from '../../layout/top-menu/top-menu.component';


import {FormBuilder, Validators, FormsModule, ReactiveFormsModule, FormGroup} from '@angular/forms';
import {STEPPER_GLOBAL_OPTIONS} from '@angular/cdk/stepper';
import {MatButtonModule} from '@angular/material/button';
import {MatInputModule} from '@angular/material/input';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatStepperModule} from '@angular/material/stepper';

@Component({
  selector: 'app-restaurantsetup',
  standalone: true,
  imports: [LeftMenuComponent,TopMenuComponent, MatStepperModule,
    FormsModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,],
  templateUrl: './restaurantsetup.component.html',
  styleUrl: './restaurantsetup.component.scss'
})
export class RestaurantsetupComponent {
  firstFormGroup!:FormGroup;
  secondFormGroup!:FormGroup;
  isEditable? :boolean;
  constructor(private _formBuilder: FormBuilder) {
    this.firstFormGroup = this._formBuilder.group({
      firstCtrl: ['', Validators.required],
    });
    this.secondFormGroup = this._formBuilder.group({
      secondCtrl: ['', Validators.required],
    });
    this.isEditable = true;
  }
 
  
}
