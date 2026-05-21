import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { RestaurantService } from '../../Services/restaurant.service';
import { SessionService } from '../../Services/session.service';


@Component({
  selector: 'app-i-login',
  standalone: true,
  imports: [ReactiveFormsModule,CommonModule],
  templateUrl: './i-login.component.html',
  styleUrl: './i-login.component.scss'
})
export class ILoginComponent {
  form!:FormGroup
  isLoading:any
  isinvalid:boolean=false
  constructor(private router: Router,private fb: FormBuilder,private service:RestaurantService, private session: SessionService)
  {
    this.form = this.fb.group({
      username: ['', Validators.required],
      password: ['', Validators.required],
     
    });
  }
  ngOnInit(): void {}
  Register():void
  {
    
    window.open('/signup', '_blank');
    
  }
  forgotpassword():void
  {
    window.open('/forgotpassword', '_blank');
  }
  onLogin() {
    if (this.form.invalid) {
      this.form.markAllAsTouched(); // Mark all fields as touched to trigger validation messages
      return;
  }
    if(this.form.valid)
      {
  this.isLoading = true; 
    this.service.RestaurantLogin(this.form.controls['username'].value,this.form.controls['password'].value,'iMobile').subscribe(
      response => {
         const token = response?.token ?? response?.accessToken ?? response?.jwtToken ?? response?.data?.token ?? response?.data?.accessToken;
         if (token) {
           this.session.setItem('authToken', String(token));
         }

         this.session.setItem('restaurantName', String(response.restaurantName ?? ''));
         this.session.setItem('restaurantId', String(response.restaurantId ?? 0));
        this.isLoading = false; 
if(response.restaurantId>0)
  {
        window.open('/dashboard', '_blank');
      }
      else
      {
        this.isinvalid=true;
      }
      },
      error => {
        this.isinvalid=true;
        console.error('Login failed', error);
        // Handle error response
      }
    );
  }
  }
}
