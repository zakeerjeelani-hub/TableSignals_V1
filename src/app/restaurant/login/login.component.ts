import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators,FormControl } from '@angular/forms';
import { ActivatedRoute, Router, RouterOutlet } from '@angular/router';
import { RestaurantService } from '../../Services/restaurant.service';
import { HttpClient } from '@angular/common/http';


import { CommonModule } from '@angular/common';
import { MatIcon } from '@angular/material/icon';
import { GeocodingService } from '../../Services/geocoding.service';
import { SessionService } from '../../Services/session.service';
@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  
  standalone: true,
  imports: [ReactiveFormsModule,CommonModule,MatIcon],
styleUrl:'./login.component.scss'
  
})
export class LoginComponent implements OnInit{
  passwordVisible: boolean = false;
  isLoading = false;
  form: FormGroup;
  isinvalid:boolean=false;
  zip!:string;
countyInfo: any = null;
  constructor(private geoservice: GeocodingService ,private route: ActivatedRoute,private router: Router,private fb: FormBuilder,private service:RestaurantService,private http: HttpClient, private session: SessionService) {
    
    this.form = this.fb.group({
      username: ['', Validators.required],
      password: ['', Validators.required],
     
    });


//      this.route.queryParams.subscribe(params => {
//       if (params['zip']) {
//         this.zip = params['zip'];
// this.GetCountyDetails();        
//       }
//     });

    
  }
 GetCountyDetails() {
    this.countyInfo = null;
    //Sample commented geocode call example:
    this.geoservice.getCountyByZipCode(this.zip).subscribe({
      next: (result) => {
        if (result) {
          this.countyInfo = result;
        }
      },
      error: (err) => {
        console.error('Lookup error:', err);
      }
    });
  }
  onLogin() {
  if (this.form.invalid) {
    this.form.markAllAsTouched();
    return;
  }
  this.isLoading = true;
    this.service.RestaurantLogin(this.form.controls['username'].value,this.form.controls['password'].value,'abc').subscribe(
      response => {
        const payload = response?.data ?? response;
        const token = payload?.token ?? payload?.accessToken ?? payload?.jwtToken;
        const restaurantId = Number(payload?.restaurantId ?? payload?.RestaurantId ?? 0);
        const hasTables = Boolean(payload?.hasTables ?? payload?.HasTables ?? false);
        const roleID = Number(payload?.roleID ?? payload?.RoleID ?? 0);
        const isAdmin = String(payload?.isAdmin ?? payload?.IsAdmin ?? '');
        if (token) {
          this.session.setItem('authToken', String(token));
          this.session.setSessionItem('sessionAuthToken', String(token));
        }

        this.session.setItem('restaurantName', String(payload?.restaurantName ?? payload?.RestaurantName ?? ''));
        this.session.setSessionItem('sessionRestaurantName', String(payload?.restaurantName ?? payload?.RestaurantName ?? ''));
        this.session.setItem('restaurantId', String(restaurantId));
        this.session.setSessionItem('sessionRestaurantId', String(restaurantId));
        this.session.setItem('userId', String(payload?.userId ?? payload?.UserId ?? 0));
        this.session.setSessionItem('sessionUserId', String(payload?.userId ?? payload?.UserId ?? 0));
        this.session.setItem('userName', String(payload?.userName ?? payload?.UserName ?? ''));
        this.session.setSessionItem('sessionUserName', String(payload?.userName ?? payload?.UserName ?? ''));
        this.session.setItem('roleID', String(roleID));
        this.session.setSessionItem('sessionRoleID', String(roleID));
        this.session.setItem('isAdmin', isAdmin);
        this.session.setSessionItem('sessionAdmin', isAdmin);
        this.isLoading = false; 
        if(restaurantId > 0)
          {
            // Give session storage time to complete before navigating
            setTimeout(() => {
              if(hasTables === false) {
                this.router.navigate(['/RestaurantQuickSetup']);
              } else {
                this.router.navigate(['/dashboard']);
              }
            }, 100);
        }
      else
      {
        this.isLoading = false; 
        this.isinvalid=true;
        return
      }
        // Handle success response
      },
      error => {
        this.isinvalid=true;
        this.isLoading = false;
        console.error('Login failed', error);
        // Handle error response
      }
    );

  }
  ngOnInit(): void {}
  Register():void
  {this.router.navigate(['/signup']);}
  forgotpassword():void
  {this.router.navigate(['/forgotpassword']);}
}
