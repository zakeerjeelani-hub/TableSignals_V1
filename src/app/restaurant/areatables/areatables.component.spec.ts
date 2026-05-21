import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AreatablesComponent } from './areatables.component';

describe('AreatablesComponent', () => {
  let component: AreatablesComponent;
  let fixture: ComponentFixture<AreatablesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AreatablesComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AreatablesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
