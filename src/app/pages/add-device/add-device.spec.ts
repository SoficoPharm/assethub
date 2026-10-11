import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Router, provideRouter } from '@angular/router';
import { vi } from 'vitest';

import { AddDevice } from './add-device';
import { NotificationService } from '../../core/notification.service';
import { environment } from '../../../environments/environment';

const DEVICES_URL = `${environment.apiUrl}/Devices`;
const CHECK_URL = `${environment.apiUrl}/Devices/check-serial`;

describe('AddDevice serial numbers', () => {
  let fixture: ComponentFixture<AddDevice>;
  let component: AddDevice;
  let http: HttpTestingController;
  let router: Router;
  let notify: NotificationService;
  let el: HTMLElement;

  const cards = () => Array.from(el.querySelectorAll<HTMLElement>('.device-card'));
  const serialInputs = () => Array.from(el.querySelectorAll<HTMLInputElement>('input[placeholder="Enter Serial Number"]'));
  const nameInputs = () => Array.from(el.querySelectorAll<HTMLInputElement>('input[placeholder="e.g. Ahmed Laptop"]'));
  const fieldErrors = (card: HTMLElement) => Array.from(card.querySelectorAll('.field-error')).map(e => e.textContent!.trim());
  const saveButton = () => el.querySelector<HTMLButtonElement>('button.primary-btn')!;

  function type(input: HTMLInputElement, value: string) {
    input.value = value;
    input.dispatchEvent(new Event('input'));
  }

  async function addDevices(count: number) {
    // Click like a user: a DOM event is what schedules a render in a zoneless app.
    for (let i = 1; i < count; i++) el.querySelector<HTMLButtonElement>('.add-device-line-btn')!.click();
    await fixture.whenStable();
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AddDevice],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()]
    }).compileComponents();

    fixture = TestBed.createComponent(AddDevice);
    component = fixture.componentInstance;
    el = fixture.nativeElement;
    http = TestBed.inject(HttpTestingController);
    router = TestBed.inject(Router);
    notify = TestBed.inject(NotificationService);
    vi.spyOn(router, 'navigate').mockResolvedValue(true);
    await fixture.whenStable();
  });

  afterEach(() => http.verify());

  it('checks the normalized serial on blur and shows the error immediately, disabling Save', async () => {
    type(serialInputs()[0], '  cl7wnl3 ');
    serialInputs()[0].dispatchEvent(new Event('blur'));

    const req = http.expectOne(r => r.url === CHECK_URL);
    expect(req.request.params.get('serial')).toBe('CL7WNL3');
    expect(req.request.params.has('excludeCode')).toBe(false);

    req.flush({ exists: true, deviceCode: 'DEV-0012', deviceName: 'Dell Latitude' });

    // No whenStable()/detectChanges() here: the component must render on its own.
    expect(fieldErrors(cards()[0])).toEqual(['Already used by DEV-0012 - Dell Latitude']);
    expect(saveButton().disabled).toBe(true);
  });

  it('clears the error when the serial is edited again', async () => {
    type(serialInputs()[0], 'CL7WNL3');
    serialInputs()[0].dispatchEvent(new Event('blur'));
    http.expectOne(r => r.url === CHECK_URL).flush({ exists: true, deviceCode: 'DEV-0002', deviceName: 'X' });

    type(serialInputs()[0], 'CL7WNL4');
    await fixture.whenStable();

    expect(fieldErrors(cards()[0])).toEqual([]);
  });

  it('does not check an empty serial (devices without a serial are allowed)', async () => {
    type(serialInputs()[0], '   ');
    serialInputs()[0].dispatchEvent(new Event('blur'));

    http.expectNone(r => r.url === CHECK_URL);
    expect(fieldErrors(cards()[0])).toEqual([]);
  });

  it('flags serials repeated inside the batch (ignoring case and spaces) and sends nothing', async () => {
    await addDevices(3);
    nameInputs().forEach((input, i) => type(input, `Laptop ${i + 1}`));
    type(serialInputs()[0], ' abc-1');
    type(serialInputs()[1], 'XYZ-9');
    type(serialInputs()[2], 'ABC-1 ');
    await fixture.whenStable();

    component.saveDevices();

    http.expectNone(DEVICES_URL);
    expect(fieldErrors(cards()[0])).toEqual(['Same serial as Device #3 in this batch']);
    expect(fieldErrors(cards()[1])).toEqual([]);
    expect(fieldErrors(cards()[2])).toEqual(['Same serial as Device #1 in this batch']);
    expect(notify.toast()?.message).toBe('Some serial numbers are repeated in this batch.');
  });

  it('saves one at a time, keeps only the device that got 409 with its data, and toasts the API message', async () => {
    await addDevices(3);
    nameInputs().forEach((input, i) => type(input, `Laptop ${i + 1}`));
    serialInputs().forEach((input, i) => type(input, `SN-${i + 1}`));
    await fixture.whenStable();

    component.saveDevices();

    // Sequential: the second request is only sent after the first answers.
    http.expectOne(DEVICES_URL).flush({ deviceCode: 'DEV-0010' });
    http.expectOne(DEVICES_URL).flush(
      { message: 'Serial number SN-2 already exists on device DEV-0002 (HQ-DEV-SAP-GJAM)' },
      { status: 409, statusText: 'Conflict' }
    );
    http.expectOne(DEVICES_URL).flush({ deviceCode: 'DEV-0011' });

    expect(component.devicesToAdd.length).toBe(1);
    expect(component.devicesToAdd[0].deviceName).toBe('Laptop 2');
    expect(component.devicesToAdd[0].serialNumber).toBe('SN-2');

    const card = cards()[0];
    expect(card.classList).toContain('has-error');
    expect(card.querySelector('.save-error')!.textContent!.trim())
      .toBe('Not saved: Serial number SN-2 already exists on device DEV-0002 (HQ-DEV-SAP-GJAM)');
    expect(notify.toast()?.message)
      .toBe('2 saved, 1 not saved. Laptop 2: Serial number SN-2 already exists on device DEV-0002 (HQ-DEV-SAP-GJAM)');
    expect(router.navigate).not.toHaveBeenCalled();
  });

  it('sends the normalized serial and navigates when every device saves', async () => {
    type(nameInputs()[0], 'Laptop');
    type(serialInputs()[0], ' cl7wnl3 ');
    await fixture.whenStable();

    component.saveDevices();

    const req = http.expectOne(DEVICES_URL);
    expect((req.request.body as FormData).get('SerialNumber')).toBe('CL7WNL3');
    req.flush({ deviceCode: 'DEV-0010' });

    expect(router.navigate).toHaveBeenCalledWith(['/devices']);
  });

  it('checks the serial right after a system-info import', async () => {
    const json = JSON.stringify({ hostName: 'HQ-PC-01', serviceTag: 'cl7wnl3', systemManufacturer: 'Dell' });
    const file = new File([json], 'info.json', { type: 'application/json' });
    const input = document.createElement('input');
    Object.defineProperty(input, 'files', { value: [file] });

    component.onDeviceScanFile({ target: input } as unknown as Event, 0);
    await vi.waitFor(() => http.expectOne(r => r.url === CHECK_URL && r.params.get('serial') === 'CL7WNL3')
      .flush({ exists: true, deviceCode: 'DEV-0002', deviceName: 'HQ-DEV-SAP-GJAM' }));

    expect(fieldErrors(cards()[0])).toEqual(['Already used by DEV-0002 - HQ-DEV-SAP-GJAM']);
    expect(saveButton().disabled).toBe(true);
  });
});
