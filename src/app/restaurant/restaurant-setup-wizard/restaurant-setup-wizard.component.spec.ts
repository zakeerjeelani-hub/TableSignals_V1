import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RestaurantSetupWizardComponent } from './restaurant-setup-wizard.component';

describe('RestaurantSetupWizardComponent', () => {
  let component: RestaurantSetupWizardComponent;
  let fixture: ComponentFixture<RestaurantSetupWizardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RestaurantSetupWizardComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RestaurantSetupWizardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
