import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RestaurantUserGridComponent } from './restaurant-user-grid.component';

describe('RestaurantUserGridComponent', () => {
  let component: RestaurantUserGridComponent;
  let fixture: ComponentFixture<RestaurantUserGridComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RestaurantUserGridComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RestaurantUserGridComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
