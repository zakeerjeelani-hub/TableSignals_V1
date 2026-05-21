import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RestaurantsetupComponent } from './restaurantsetup.component';

describe('RestaurantsetupComponent', () => {
  let component: RestaurantsetupComponent;
  let fixture: ComponentFixture<RestaurantsetupComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RestaurantsetupComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RestaurantsetupComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
