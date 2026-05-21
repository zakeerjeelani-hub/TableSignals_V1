import { ChangeDetectorRef, Component, OnInit } from '@angular/core';

// import { Router } from 'express';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms'
import { Router, RouterOutlet } from '@angular/router';
import { RestaurantService } from '../../Services/restaurant.service';
import { CommonModule } from '@angular/common';

import { SuccessMessageComponent } from '../../common/success-message/success-message.component';
import { BackButtonComponent } from '../../common/back-button/back-button.component';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { SessionService } from '../../Services/session.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [
    ReactiveFormsModule, CommonModule, SuccessMessageComponent, BackButtonComponent,
    MatIconModule, MatFormFieldModule, MatInputModule, MatButtonModule],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.scss'
})
export class ProfileComponent implements OnInit{
  form:FormGroup ;
  passwordVisible: boolean = false;
  sidenavVisible: boolean = true;

  selectedFile: File | null = null;
   base64String: string | null = null;
   isLoading = false;
   uploadSuccess: boolean = false;
 
   socialMediaPlatforms: string[] = ['Facebook', 'Twitter', 'Instagram'];
   restaurantId!: number;
   userId!: number;
   restaurant:any;
   
 constructor(
  public router:Router,public fb:FormBuilder,
    private service: RestaurantService,
    private cdr: ChangeDetectorRef,
    private session: SessionService
)
 {
  this.restaurantId = this.session.getNumber('restaurantId');
  this.userId = this.session.getNumber('userId');
  if (this.restaurantId === 0) {
    this.router.navigate(['login']);
  }


   this.form = this.fb.group({
     restaurantId:[0],
     restaurantName: ['',[Validators.required,Validators.minLength(3)]],
     emailID: ['',[Validators.required,Validators.email]],
     userName: ['',[Validators.required, Validators.minLength(3)]],
     password: ['',[Validators.required,Validators.minLength(3)]],
     
     phoneNo: ['', [Validators.required, Validators.pattern('^[+]?[0-9]+$'),Validators.maxLength(12)]],
     address: ['',],
     webSite: [''],
     socialMedia: [''], // Ensure this is initialized as FormArray
     socialMediaArray: this.fb.array([]), // Ensure this is initialized as FormArray
     mode: ['U'],
     logo: [''],
     timeZone: ['PST']
   });
   this.initSocialMediaControls();
   
 }
   goHome(){this.router.navigate(['dashboard']);}
 ngOnInit(): void {
  this.loadRestaurantProfile();
}

loadRestaurantProfile(): void {
  this.service.GetRestaurantUserProfile(this.userId).subscribe(
    (res: any) => {
      this.restaurant = res;
      this.form.patchValue({
        restaurantId: res.restaurantId,
        restaurantName: this.session.getItem("restaurantName"),
        emailID: res.emailID,
        userName: res.userName,
        password: res.password,
        phoneNo: this.formatPhoneNumberAdvanced(res.phoneNo),
        address: res.address,
        webSite: res.webSite,
        logo: res.logo,
        timeZone: res.timeZone,
        socialMedia: res.socialMedia || '',
      });

      // Update social media checkboxes if available
      const socialMediaArray = res.socialMedia?.split(', ') || [];
      const formArray = this.form.get('socialMediaArray') as FormArray;
      formArray.clear(); // Clear any previous data
      this.socialMediaPlatforms.forEach(platform => {
        formArray.push(this.fb.control(socialMediaArray.includes(platform)));
      });
    },
    error => {
      console.error('Error loading restaurant profile:', error);
    }
  );
}
formatPhoneNumberAdvanced(phoneNumber: string): string {
  if (!phoneNumber) return '';
  
  const cleaned = phoneNumber.replace(/\D/g, '');
  
  switch (cleaned.length) {
    case 10:
      // Format: (XXX)XXX-XXXX
      return cleaned.replace(/(\d{3})(\d{3})(\d{4})/, '($1)$2-$3');
    case 11:
      // Format: X(XXX)XXX-XXXX (assuming first digit is country code)
      return cleaned.replace(/(\d{1})(\d{3})(\d{3})(\d{4})/, '$1($2)$3-$4');
    case 7:
      // Format: XXX-XXXX (local number)
      return cleaned.replace(/(\d{3})(\d{4})/, '$1-$2');
    default:
      return phoneNumber; // Return as-is if doesn't match expected patterns
  }
}
 initSocialMediaControls() {
   const formArray = this.form.get('socialMediaArray') as FormArray; // Ensure casting to FormArray
   this.socialMediaPlatforms.forEach(() => formArray.push(this.fb.control(false)));
 }
 
 RestaurantSignup(): void {
   this.isLoading = true;
   this.form.get("logo")?.setValue(this.base64String);
 
   // Get the selected social media platforms
 
   const selectedPlatforms = this.getSelectedSocialMedia(); // This returns a string
   this.form.get('socialMedia')?.setValue(selectedPlatforms); // Set the comma-separated string
   const formData = { ...this.form.value }; // Clone form value
   delete formData.socialMediaArray; // Remove socialMediaArray from the data
   this.service.TSRestaurantSignUp(formData).subscribe(
     response => {
       this.isLoading = false;
       this.uploadSuccess = true;
      //  this.clearform();
     },
     error => {
       this.isLoading = false;
       console.error('Registration failed', error);
     }
   );
 }
 
 getSelectedSocialMedia(): string {
   const selected: string[] = [];
   const formArray = this.form.get('socialMediaArray') as FormArray;
   formArray.controls.forEach((control, index) => {
     if (control.value) {
       selected.push(this.socialMediaPlatforms[index]);
     }
   });
   // Join the selected platforms into a comma-separated string
   return selected.join(', ');
 }
 
 Cancel():void{
   this.router.navigate(['/login']);
 
 }
 clearform():void {
   this.form.patchValue({
     restaurantId:[0],
     restaurantName: [''],
     emailID: [''],
     userName: [''],
     password: [''],
     
     phoneNo: [''],
     address: [''],
     webSite: [''],
     socialMedia: this.fb.array([]), // Ensure this is initialized as FormArray
     mode: ['I'],
     logo: [''],
     timeZone: ['PST']
   });
 
   this.initSocialMediaControls(); // Reset the social media checkboxes
 }
 hidePasswordWithDelay() {
  setTimeout(() => {
    this.passwordVisible = false;
  }, 500); // 500ms delay before hiding
}
 }
 