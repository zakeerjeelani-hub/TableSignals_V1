import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Areatables1Component } from './areatables1.component';

describe('Areatables1Component', () => {
  let component: Areatables1Component;
  let fixture: ComponentFixture<Areatables1Component>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Areatables1Component]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Areatables1Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
