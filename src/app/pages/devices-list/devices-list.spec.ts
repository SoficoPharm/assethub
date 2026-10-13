import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DevicesList } from './devices-list';
import { DeviceRow } from '../../services/devices.service';

describe('DevicesList', () => {
  let component: DevicesList;
  let fixture: ComponentFixture<DevicesList>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DevicesList],
    }).compileComponents();

    fixture = TestBed.createComponent(DevicesList);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('lists the filled specs, including the screen size, in the Model tooltip', () => {
    const device = { cpu: 'Core i7', ram: '16 GB', storage: '512 GB', screenSizeInches: 15.6, screens: 2 } as DeviceRow;

    expect(component.specsTooltip(device)).toBe('CPU: Core i7\nRAM: 16 GB\nStorage: 512 GB\nScreen size: 15.6"\nNumber of screens: 2');
    expect(component.specsTooltip({ ram: 'N/A' } as DeviceRow)).toBe('RAM: N/A');
  });
});
