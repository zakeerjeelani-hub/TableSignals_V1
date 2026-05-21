import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SaveTemplateDialogComponent } from './save-template-dialog.component';

describe('SaveTemplateDialogComponent', () => {
  let component: SaveTemplateDialogComponent;
  let fixture: ComponentFixture<SaveTemplateDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SaveTemplateDialogComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SaveTemplateDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
