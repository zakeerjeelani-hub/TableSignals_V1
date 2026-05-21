import { ComponentFixture, TestBed } from '@angular/core/testing';

import { QRGeneratorComponent } from './qrgenerator.component';

describe('QRGeneratorComponent', () => {
  let component: QRGeneratorComponent;
  let fixture: ComponentFixture<QRGeneratorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [QRGeneratorComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(QRGeneratorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
