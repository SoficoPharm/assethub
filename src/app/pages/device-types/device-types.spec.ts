import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DeviceTypes } from './device-types';

describe('DeviceTypes', () => {
  let component: DeviceTypes;
  let fixture: ComponentFixture<DeviceTypes>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DeviceTypes],
    }).compileComponents();

    fixture = TestBed.createComponent(DeviceTypes);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
