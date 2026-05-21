import { Component, Inject, OnInit, PLATFORM_ID } from '@angular/core';

import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms'
import { Router, RouterOutlet } from '@angular/router';
import { RestaurantService } from '../../Services/restaurant.service';
import { CommonModule, isPlatformBrowser } from '@angular/common';

import { SuccessMessageComponent } from '../../common/success-message/success-message.component';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectChange, MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { ErrormessageComponent } from '../../common/errormessage/errormessage.component';
@Component({
  selector: 'app-signup',
  standalone: true,
  imports: [
    ErrormessageComponent, ReactiveFormsModule, CommonModule, SuccessMessageComponent,
    MatFormFieldModule, MatInputModule, MatSelectModule, MatIconModule, MatButtonModule
  ],
  templateUrl: './signup.component.html',
  styleUrl: './signup.component.scss'
})
export class SignupComponent implements  OnInit{
  passwordVisible: boolean = false;
  countries: any[] = [];
  states: any[] = [];
  cities: any[] = [];
  defaultCountryId = 45;
 form:FormGroup 
 selectedFile: File | null = null;
  base64String: string | null = "";
  isLoading = false;
  uploadSuccess: boolean = false;
  uploaderror: boolean = false;
  message: string="" ;

  socialMediaPlatforms: string[] = ['Facebook', 'Twitter', 'Instagram'];
  


  
constructor(public router:Router,public fb:FormBuilder,public service:RestaurantService,
  @Inject(PLATFORM_ID) private platformId: Object,

)
{
  if (isPlatformBrowser(this.platformId)) {
  }
  this.form = this.fb.group({
    restaurantId:[0],
    restaurantName: ['',[Validators.required,Validators.minLength(3)]],
    emailID: ['',[Validators.required,Validators.email]],
    userName: [''],
    password: ['',[Validators.required,Validators.minLength(3)]],
    
    phoneNo: ['', [Validators.required, Validators.pattern('^[0-9()\-\s]*$'), Validators.maxLength(14)]],
    address: ['',],
    zip: ['',],
    city: ['',],
    countryId: [this.defaultCountryId, Validators.required],
    stateId: [this.defaultCountryId, Validators.required],
    webSite: [''],
    socialMedia: [''], // Ensure this is initialized as FormArray
    socialMediaArray: this.fb.array([]), // Ensure this is initialized as FormArray
    mode: ['I'],
    logopath: [''],
    logo: [''],
    VerificationId: [null],
    
    timeZone: ['PST']
  });
  this.initSocialMediaControls();

}
ngOnInit(): void { this.getCountries();}

initSocialMediaControls() {
  const formArray = this.form.get('socialMediaArray') as FormArray;
  formArray.clear();
  this.socialMediaPlatforms.forEach(() => formArray.push(this.fb.control(false)));
}

onPhoneNoInput(event: Event): void {
  const input = event.target as HTMLInputElement;
  const formattedValue = this.formatUsPhoneNumber(input.value);
  this.form.get('phoneNo')?.setValue(formattedValue, { emitEvent: false });
}

private getPlainPhoneNo(): string {
  return String(this.form.get('phoneNo')?.value ?? '').replace(/\D/g, '').slice(0, 10);
}

private formatUsPhoneNumber(value: string): string {
  const digits = String(value ?? '').replace(/\D/g, '').slice(0, 10);

  if (!digits) {
    return '';
  }

  if (digits.length <= 3) {
    return `(${digits}`;
  }

  if (digits.length <= 6) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
  }

  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
}

RestaurantSignup(): void {
  const plainPhoneNo = this.getPlainPhoneNo();
  if (plainPhoneNo.length < 10) {
    this.form.get('phoneNo')?.setErrors({ invalidPhone: true });
    this.form.get('phoneNo')?.markAsTouched();
    return;
  }

  this.isLoading = true;
  this.uploadSuccess = false;
  this.uploaderror = false;
  this.form.get("logo")?.setValue(this.base64String);

  const selectedPlatforms = this.getSelectedSocialMedia();
  this.form.get('socialMedia')?.setValue(selectedPlatforms);

  const formData = {
    ...this.form.value,
    phoneNo: plainPhoneNo
  };
  delete formData.socialMediaArray;

  this.service.TSRestaurantSignUp(formData).subscribe(
    response => {
      this.isLoading = false;
      this.message = response.message;

      if (response.status == '400' || response.status == 400) {
        this.uploaderror = true;
        this.uploadSuccess = false;
        return;
      }

      this.uploaderror = false;
      this.uploadSuccess = true;
      this.clearform();
    },
    error => {
      this.isLoading = false;
      console.error('Registration failed', error);
      this.message = error?.error?.message || 'Registration failed. Please try again.';
      this.uploaderror = true;
      this.uploadSuccess = false;
    }
  );
}

getCountries() {
  //debugger
  this.service.getCountries().subscribe(
    data => {
      this.countries = data;
      this.form.patchValue({ countryId: this.defaultCountryId });
      this.onCountryChange({ value: this.defaultCountryId } as MatSelectChange); // ✅ Fix
    },
    error => console.error('Error fetching countries:', error)
  );
}

// Fetch states based on selected country
onCountryChange(event: MatSelectChange) { // ✅ Use MatSelectChange
  //debugger
  const countryId = event.value; // ✅ Get countryId from event.value
  this.form.patchValue({ countryId: event.value });
  if (countryId) {
    this.service.getStatesByCountry(countryId).subscribe(
      data => {
        this.states = data;
        this.form.patchValue({ stateId: this.states.length ? this.states[0].id : '' });
        if (this.states.length) this.onStateChange({ value: this.states[0].id } as MatSelectChange);
      },
      error => console.error('Error fetching states:', error)
    );
  }
}


  // Fetch cities based on selected state & country

  onStateChange(event: MatSelectChange) { // ✅ Use MatSelectChange
    //debugger
    const stateId = event.value; // ✅ Get stateId from event.value
    this.form.patchValue({ stateId: event.value });
    const countryId = this.form.get('countryId')?.value;
    if (stateId && countryId) {
    //   this.service.getCitiesByState(stateId, countryId).subscribe(
    //     data => {
    //       this.cities = data;
    //       this.form.patchValue({ cityId: this.cities.length ? this.cities[0].id : '' });
    //     },
    //     error => console.error('Error fetching cities:', error)
    //   );
     }
  }
getSelectedSocialMedia(): string {
  //debugger
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
  this.form.reset({
    restaurantId: 0,
    restaurantName: '',
    emailID: '',
    userName: '',
    password: '',
    phoneNo: '',
    address: '',
    zip: '',
    city: '',
    countryId: this.defaultCountryId,
    stateId: this.defaultCountryId,
    webSite: '',
    socialMedia: '',
    mode: 'I',
    logo: '',
    logopath: '',
    VerificationId: null,
    timeZone: 'PST'
  });

  this.base64String = '';
  this.selectedFile = null;
  this.initSocialMediaControls();
  this.form.markAsPristine();
  this.form.markAsUntouched();
  this.form.updateValueAndValidity();
}
hidePasswordWithDelay() {
  setTimeout(() => {
    this.passwordVisible = false;
  }, 500); // 500ms delay before hiding
}

trackByCountryId(_: number, c: any): number { return c.countryId; }
trackByStateId(_: number, s: any): number { return s.stateId; }
trackByIndex(index: number): number { return index; }
}
