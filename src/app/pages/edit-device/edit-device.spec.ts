import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ActivatedRoute, Router, convertToParamMap, provideRouter } from '@angular/router';
import { vi } from 'vitest';

import { EditDevice } from './edit-device';
import { NotificationService } from '../../core/notification.service';
import { environment } from '../../../environments/environment';

const DEVICE_URL = `${environment.apiUrl}/Devices/by-code/DEV-0003`;
const CHECK_URL = `${environment.apiUrl}/Devices/check-serial`;

describe('EditDevice serial numbers', () => {
  let fixture: ComponentFixture<EditDevice>;
  let http: HttpTestingController;
  let notify: NotificationService;
  let el: HTMLElement;

  const serialInput = () => el.querySelector<HTMLInputElement>('input[name="serialNumber"]')!;
  const fieldError = () => el.querySelector('.field-error')?.textContent?.trim() ?? '';
  const saveButton = () => el.querySelector<HTMLButtonElement>('button.primary-btn')!;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EditDevice],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: convertToParamMap({ code: 'DEV-0003' }) } } }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(EditDevice);
    el = fixture.nativeElement;
    http = TestBed.inject(HttpTestingController);
    notify = TestBed.inject(NotificationService);
    vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);

    fixture.detectChanges();
    http.expectOne(DEVICE_URL).flush({
      id: 1002, name: 'Spare laptop', code: 'DEV-0003', serialNumber: 'OWN-SERIAL', status: 'Available',
      type: 'Laptop', platform: 'Windows', brand: 'Dell', model: 'Latitude', assignedUser: '—'
    });
    await fixture.whenStable();
  });

  afterEach(() => http.verify());

  function blurWith(value: string) {
    serialInput().value = value;
    serialInput().dispatchEvent(new Event('input'));
    serialInput().dispatchEvent(new Event('blur'));
  }

  it('checks excluding the device being edited and shows the error immediately', () => {
    blurWith('cl7wnl3');

    const req = http.expectOne(r => r.url === CHECK_URL);
    expect(req.request.params.get('serial')).toBe('CL7WNL3');
    expect(req.request.params.get('excludeCode')).toBe('DEV-0003');
    req.flush({ exists: true, deviceCode: 'DEV-0002', deviceName: 'HQ-DEV-SAP-GJAM' });

    // No whenStable()/detectChanges(): the component must render on its own.
    expect(fieldError()).toBe('Already used by DEV-0002 - HQ-DEV-SAP-GJAM');
    expect(saveButton().disabled).toBe(true);
  });

  it('keeps Save enabled when the serial is free', () => {
    blurWith('NEW-SERIAL');
    http.expectOne(r => r.url === CHECK_URL).flush({ exists: false, deviceCode: null, deviceName: null });

    expect(fieldError()).toBe('');
    expect(saveButton().disabled).toBe(false);
  });

  it('shows the 409 message from the API in the toast', () => {
    saveButton().click();

    http.expectOne(DEVICE_URL).flush(
      { message: 'Serial number OWN-SERIAL already exists on device DEV-0002 (HQ-DEV-SAP-GJAM)' },
      { status: 409, statusText: 'Conflict' }
    );
    // After a 409 the field is re-checked so the inline error appears too.
    http.expectOne(r => r.url === CHECK_URL).flush({ exists: true, deviceCode: 'DEV-0002', deviceName: 'HQ-DEV-SAP-GJAM' });

    expect(notify.toast()?.message).toBe('Serial number OWN-SERIAL already exists on device DEV-0002 (HQ-DEV-SAP-GJAM)');
    expect(fieldError()).toBe('Already used by DEV-0002 - HQ-DEV-SAP-GJAM');
  });
});
