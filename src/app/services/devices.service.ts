import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { Observable } from 'rxjs';

export type DeviceStatus = 'Available' | 'Assigned' | 'Maintenance' | 'Inactive' | 'Lost';

export const DEVICE_STATUSES: DeviceStatus[] = ['Available', 'Assigned', 'Maintenance', 'Inactive', 'Lost'];

/** Statuses that can be set by editing a device. Assigned is only set through Assignments. */
export const EDITABLE_DEVICE_STATUSES: DeviceStatus[] = ['Available', 'Maintenance', 'Inactive', 'Lost'];

export interface SerialCheckResult {
  exists: boolean;
  deviceCode: string | null;
  deviceName: string | null;
}

/** Same rule as the API: trim, upper-case, empty means "no serial". */
export function normalizeSerial(serial: string | null | undefined): string {
  return (serial ?? '').trim().toUpperCase();
}

/** Inline error text for a serial already used by another device. */
export function serialInUseMessage(result: SerialCheckResult): string {
  return `Already used by ${result.deviceCode} - ${result.deviceName}`;
}

/** Fields whose requirement depends on the device type. Mirrors the API rules. */
export type RequiredDeviceField = 'Device Type' | 'Serial Number' | 'RAM' | 'Storage' | 'CPU';

/** Device types (case-insensitive) that need RAM, Storage and CPU. */
const TYPES_REQUIRING_HARDWARE = ['laptop', 'desktop'];

/** Device types (case-insensitive) that may be saved without a serial number. */
const TYPES_WITHOUT_SERIAL = ['bag', 'sim line'];

const normalizeType = (deviceType: string | null | undefined) => (deviceType ?? '').trim().toLowerCase();

export function requiresHardware(deviceType: string | null | undefined): boolean {
  return TYPES_REQUIRING_HARDWARE.includes(normalizeType(deviceType));
}

/** Every type except Bag and SIM Line needs a serial (also while no type is chosen yet). */
export function requiresSerial(deviceType: string | null | undefined): boolean {
  return !TYPES_WITHOUT_SERIAL.includes(normalizeType(deviceType));
}

/** For Laptop/Desktop hardware, "N/A" is not a value. */
function isRealValue(value: string | null | undefined): boolean {
  const text = (value ?? '').trim();
  return !!text && text.toUpperCase() !== 'N/A';
}

export interface RequiredDeviceValues {
  deviceType: string | null | undefined;
  serialNumber: string | null | undefined;
  ram: string | null | undefined;
  /** The value sent as Storage (Storage 1, else Storage 2). */
  storage: string | null | undefined;
  cpu: string | null | undefined;
}

/** The required fields that are still empty for this device's type. */
export function missingDeviceFields(values: RequiredDeviceValues): RequiredDeviceField[] {
  const missing: RequiredDeviceField[] = [];

  if (!values.deviceType?.trim()) missing.push('Device Type');
  if (requiresSerial(values.deviceType) && !normalizeSerial(values.serialNumber)) missing.push('Serial Number');

  if (requiresHardware(values.deviceType)) {
    if (!isRealValue(values.ram)) missing.push('RAM');
    if (!isRealValue(values.storage)) missing.push('Storage');
    if (!isRealValue(values.cpu)) missing.push('CPU');
  }

  return missing;
}

/** Inline error text under a missing required field. */
export function missingFieldMessage(field: RequiredDeviceField, deviceType: string): string {
  if (field === 'Device Type') return 'Device Type is required.';
  if (field === 'Serial Number') return `Serial Number is required for ${deviceType || 'this device type'}.`;
  return `${field} is required for ${deviceType} (N/A is not accepted).`;
}

export const MIN_SCREEN_SIZE_INCHES = 7;
export const MAX_SCREEN_SIZE_INCHES = 100;

/** Same rule as the API: optional; 7–100 with at most one decimal. Returns '' when valid. */
export function screenSizeError(size: number | null | undefined): string {
  if (size === null || size === undefined || (size as unknown) === '') return '';
  if (!Number.isFinite(size)) return 'Enter a number, e.g. 15.6.';
  if (size < MIN_SCREEN_SIZE_INCHES || size > MAX_SCREEN_SIZE_INCHES) {
    return `Screen size must be between ${MIN_SCREEN_SIZE_INCHES} and ${MAX_SCREEN_SIZE_INCHES} inches.`;
  }
  if (Math.round(size * 10) / 10 !== size) return 'Use at most one decimal, e.g. 15.6.';
  return '';
}

/** Reads a screen size from a system-info file value like 15.6, "15.6" or '15.6"'. */
export function parseScreenSize(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null;
  const size = typeof value === 'number' ? value : parseFloat(String(value));
  return Number.isFinite(size) ? size : null;
}

export interface DeviceRow {
  id: number;
  name: string;
  code: string;
  serial: string;
  imeiSerial?: string;
  serialNumber?: string;
  type: string;
  platform: string;
  brand: string;
  model: string;
  ram: string;
  storage: string;
  storage1?: string;
  storage2?: string;

  cpu?: string;
  gpu?: string;
  screens?: number | null;
  screenSizeInches?: number | null;
  printer?: boolean;
  scanner?: boolean;

  status: DeviceStatus;
  notes: string;
  internalNotes?: string;
  assignedUser: string;
  initials: string;
  imageUrl?: string;
}

export interface CreateDeviceRequest {
  deviceName: string;

  // IMEI optional
  imeiSerial?: string;
  serialNumber?: string;

  deviceType: string;
  platform: string;
  brand: string;
  model: string;
  ram: string;
  storage: string;
  storage1?: string;
  storage2?: string;

  cpu?: string;
  gpu?: string;
  screens?: number | null;
  screenSizeInches?: number | null;
  printer?: boolean;
  scanner?: boolean;

  status: string;
  notes: string;
  internalNotes?: string;
  imageUrl?: string;
  imageFile?: File | null;
}

@Injectable({ providedIn: 'root' })
export class DevicesService {
  private readonly api = environment.apiUrl;

  constructor(private readonly http: HttpClient) {}

  private toFormData(data: CreateDeviceRequest): FormData {
    const formData = new FormData();

    formData.append('DeviceName', data.deviceName ?? '');
    formData.append('ImeiSerial', data.imeiSerial ?? '');
    formData.append('SerialNumber', data.serialNumber ?? '');

    formData.append('DeviceType', data.deviceType ?? '');
    formData.append('Platform', data.platform ?? '');
    formData.append('Brand', data.brand ?? '');
    formData.append('Model', data.model ?? '');
    formData.append('Ram', data.ram ?? '');

    formData.append('Storage', data.storage ?? '');
    formData.append('Storage1', data.storage1 ?? '');
    formData.append('Storage2', data.storage2 ?? '');

    formData.append('Cpu', data.cpu ?? '');
    formData.append('Gpu', data.gpu ?? '');
    formData.append('Screens', data.screens === null || data.screens === undefined ? '' : String(data.screens));
    formData.append('ScreenSizeInches', data.screenSizeInches === null || data.screenSizeInches === undefined ? '' : String(data.screenSizeInches));
    formData.append('Printer', String(data.printer ?? false));
    formData.append('Scanner', String(data.scanner ?? false));

    formData.append('Status', data.status ?? 'Available');
    formData.append('Notes', data.notes ?? '');
    formData.append('InternalNotes', data.internalNotes ?? '');
    formData.append('ImageUrl', data.imageUrl ?? '');

    if (data.imageFile) {
      formData.append('ImageFile', data.imageFile, data.imageFile.name);
    }

    return formData;
  }

  getDevices(): Observable<DeviceRow[]> {
    return this.http.get<DeviceRow[]>(`${this.api}/Devices`);
  }

  getAvailableDevices(): Observable<DeviceRow[]> {
    return this.http.get<DeviceRow[]>(`${this.api}/Devices/available`);
  }

  checkSerial(serial: string, excludeCode?: string): Observable<SerialCheckResult> {
    let params = new HttpParams().set('serial', serial);
    if (excludeCode) params = params.set('excludeCode', excludeCode);

    return this.http.get<SerialCheckResult>(`${this.api}/Devices/check-serial`, { params });
  }

  getDeviceByCode(code: string): Observable<DeviceRow> {
    return this.http.get<DeviceRow>(`${this.api}/Devices/by-code/${code}`);
  }

  createDevice(data: CreateDeviceRequest): Observable<unknown> {
    return this.http.post(`${this.api}/Devices`, this.toFormData(data));
  }

  updateDeviceByCode(code: string, data: CreateDeviceRequest): Observable<unknown> {
    return this.http.put(`${this.api}/Devices/by-code/${code}`, this.toFormData(data));
  }

  deleteDeviceByCode(code: string): Observable<unknown> {
    return this.http.delete(`${this.api}/Devices/by-code/${code}`);
  }

  updateDeviceStatus(id: number, status: string): Observable<unknown> {
    return this.http.put(
      `${this.api}/Devices/${id}/status`,
      JSON.stringify(status),
      { headers: { 'Content-Type': 'application/json' } }
    );
  }
}