import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AssignDevice } from './assign-device';

describe('AssignDevice', () => {
  let component: AssignDevice;
  let fixture: ComponentFixture<AssignDevice>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AssignDevice],
    }).compileComponents();

    fixture = TestBed.createComponent(AssignDevice);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
