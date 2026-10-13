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
      type: 'Laptop', platform: 'Windows', brand: 'Dell', model: 'Latitude', assignedUser: '—',
      ram: '16 GB', storage1: '512 GB', cpu: 'Intel Core i7'
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

describe('EditDevice required hardware and delete permission', () => {
  let fixture: ComponentFixture<EditDevice>;
  let http: HttpTestingController;
  let notify: NotificationService;
  let el: HTMLElement;

  const fieldErrors = () => Array.from(el.querySelectorAll('.field-error')).map(e => e.textContent!.trim());
  const deleteButton = () => Array.from(el.querySelectorAll('button')).find(b => b.textContent!.includes('Delete Device'));

  async function setup(role: string, device: Record<string, unknown>) {
    localStorage.setItem('currentUser', JSON.stringify({ id: 1, fullName: 'Test', userName: 'test', role }));

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
      id: 1002, name: 'Old laptop', code: 'DEV-0003', status: 'Available', platform: 'Windows', assignedUser: '—', ...device
    });
    await fixture.whenStable();
  }

  afterEach(() => {
    http.verify();
    localStorage.removeItem('currentUser');
  });

  it('blocks Save for an existing Laptop without CPU and highlights the field', async () => {
    await setup('Admin', { type: 'Laptop', ram: '8 GB', storage1: '256 GB', cpu: '' });

    el.querySelector<HTMLButtonElement>('button.primary-btn')!.click();
    await fixture.whenStable();

    http.expectNone(DEVICE_URL);
    expect(fieldErrors()).toEqual(['CPU is required for Laptop.']);
    expect(el.querySelector('input[name="cpu"]')!.classList).toContain('invalid');
    expect(notify.toast()?.message).toBe('CPU is required for Laptop.');
  });

  it('saves a Bag without CPU, RAM or Storage', async () => {
    await setup('Admin', { type: 'Bag' });

    el.querySelector<HTMLButtonElement>('button.primary-btn')!.click();

    http.expectOne(DEVICE_URL).flush({ message: 'ok' });
    expect(fieldErrors()).toEqual([]);
  });

  it('hides Delete Device for SupportIT', async () => {
    await setup('SupportIT', { type: 'Bag' });
    expect(deleteButton()).toBeUndefined();
  });

  it('shows Delete Device for Admin', async () => {
    await setup('Admin', { type: 'Bag' });
    expect(deleteButton()).toBeDefined();
  });
});
