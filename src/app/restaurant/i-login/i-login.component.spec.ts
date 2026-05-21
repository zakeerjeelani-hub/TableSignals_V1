import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ILoginComponent } from './i-login.component';

describe('ILoginComponent', () => {
  let component: ILoginComponent;
  let fixture: ComponentFixture<ILoginComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ILoginComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ILoginComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
