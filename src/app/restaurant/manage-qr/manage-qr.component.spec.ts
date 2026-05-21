import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ManageQRComponent } from './manage-qr.component';

describe('ManageQRComponent', () => {
  let component: ManageQRComponent;
  let fixture: ComponentFixture<ManageQRComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ManageQRComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ManageQRComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
