import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RestaurantMembershipusersComponent } from './restaurant-membershipusers.component';

describe('RestaurantMembershipusersComponent', () => {
  let component: RestaurantMembershipusersComponent;
  let fixture: ComponentFixture<RestaurantMembershipusersComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RestaurantMembershipusersComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RestaurantMembershipusersComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
