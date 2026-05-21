import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NotificationHistoryDialogComponent } from './notificationhistory-dialog.component';

describe('NotificationHistoryDialogComponent', () => {
  let component: NotificationHistoryDialogComponent;
  let fixture: ComponentFixture<NotificationHistoryDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NotificationHistoryDialogComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(NotificationHistoryDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
