import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RestaurantService } from '../../Services/restaurant.service'; // Replace with your actual service path
import { Router } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { CommonModule, Location } from '@angular/common';
import { SuccessMessageComponent } from '../../common/success-message/success-message.component';
@Component({
  selector: 'app-forgot-password',
  templateUrl: './forgot-password.component.html',
  styleUrls: ['./forgot-password.component.scss'],
  standalone:true,
  imports:[MatFormFieldModule,ReactiveFormsModule,CommonModule,SuccessMessageComponent]

})
export class ForgotPasswordComponent implements OnInit {
  forgotPasswordForm: FormGroup;
  message1: string = '';
  isLoading = false;
  uploadSuccess: boolean = false;
  uploadFailure: boolean = false;
  
  constructor(
    private fb: FormBuilder,
    private restaurantService: RestaurantService,
    private router: Router,
    private location: Location
  ) {
    this.forgotPasswordForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]]
    });
  }

  ngOnInit(): void {}

  get email() {
    return this.forgotPasswordForm.get('email');
  }
  Cancel():void{
    this.router.navigate(['/login']);
  
  }
  onSubmit(): void {
    
    if (this.forgotPasswordForm.valid) {
      
      this.uploadSuccess = true;
      this.restaurantService.GetTSRestaurantForgotPassword(this.forgotPasswordForm.value.email).subscribe({
        next: (response) => {
                    this.forgotPasswordForm.patchValue({
            emailID: [''],
          });
          //this.uploadSuccess = true;
        },
        error: (err) => {
                    this.forgotPasswordForm.patchValue({
            emailID: [''],
          });
          //this.uploadFailure = true;
        }
      });
    }
  }
}
