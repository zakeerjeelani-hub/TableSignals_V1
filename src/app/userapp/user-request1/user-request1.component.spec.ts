import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UserRequest1Component } from './user-request1.component';

describe('UserRequest1Component', () => {
  let component: UserRequest1Component;
  let fixture: ComponentFixture<UserRequest1Component>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UserRequest1Component]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UserRequest1Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
