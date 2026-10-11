import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DeviceDetails } from './device-details';

describe('DeviceDetails', () => {
  let component: DeviceDetails;
  let fixture: ComponentFixture<DeviceDetails>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DeviceDetails],
    }).compileComponents();

    fixture = TestBed.createComponent(DeviceDetails);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
