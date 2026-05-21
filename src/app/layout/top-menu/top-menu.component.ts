import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { RestaurantService } from '../../Services/restaurant.service';
import { SessionService } from '../../Services/session.service';
@Component({
  selector: 'app-top-menu',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './top-menu.component.html',
  styleUrl: './top-menu.component.scss'
})

export class TopMenuComponent  implements OnInit {
  enableService: boolean = true;
  restaurantname?:string='';
  restaurantlogo?:string='';
  restaurantId:number=0
  constructor(public route:Router,@Inject(PLATFORM_ID) private platformId: Object,    private service: RestaurantService,
    private session: SessionService,
  ) {
    if (isPlatformBrowser(this.platformId)) {
      this.restaurantId = this.session.getNumber('restaurantId', 0);
    }
  }
  
  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.service.TSGetEnableDisableService(this.restaurantId).subscribe(
        response => {
          this.enableService= response.isServiceEnabled;
         //  this.clearform();
        },
        error => {
          console.error('Registration failed', error);
        }
      );

      if(this.session.getItem('isAdmin') === 'Admin')
      {
        this.restaurantname="Admin Panel"  
      }
      else
      {
      this.restaurantname= this.session.getItem('restaurantName') ?? '';
      this.restaurantlogo=this.restaurantname?.replaceAll(' ','')+'.png';
    }
    }
  }

  SignOut()
  {
    this.session.clearLocal();
    this.route.navigate(['login']);
  }


  enabledisableservice()
  {

    if(this.enableService==true)
    this.enableService=false
  else
  this.enableService=true

    this.service.TSEnableDisableService(this.restaurantId,this.enableService).subscribe(
    response => {
      if(this.enableService)
        alert('Restaurant Service is Enabled for the User');
else
alert('Restaurant Service is Disabled for the User');

     //  this.clearform();
    },
    error => {
      console.error('Registration failed', error);
    }
  );
}


}
