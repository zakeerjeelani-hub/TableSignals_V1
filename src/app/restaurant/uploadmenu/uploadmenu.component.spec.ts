import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UploadmenuComponent } from './uploadmenu.component';

describe('UploadmenuComponent', () => {
  let component: UploadmenuComponent;
  let fixture: ComponentFixture<UploadmenuComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UploadmenuComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UploadmenuComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
