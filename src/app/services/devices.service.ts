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

export type HardwareField = 'RAM' | 'Storage' | 'CPU';

/** Device types (case-insensitive) that need RAM, Storage and CPU. Mirrors the API rule. */
const TYPES_REQUIRING_HARDWARE = ['laptop', 'desktop'];

export function requiresHardware(deviceType: string | null | undefined): boolean {
  return TYPES_REQUIRING_HARDWARE.includes((deviceType ?? '').trim().toLowerCase());
}

/**
 * The hardware fields still empty for a Laptop or Desktop; always [] for other types.
 * `storage` is the value sent as Storage (Storage 1, else Storage 2).
 */
export function missingHardware(
  deviceType: string | null | undefined,
  values: { ram: string | null | undefined; storage: string | null | undefined; cpu: string | null | undefined }
): HardwareField[] {
  if (!requiresHardware(deviceType)) return [];

  const missing: HardwareField[] = [];
  if (!values.ram?.trim()) missing.push('RAM');
  if (!values.storage?.trim()) missing.push('Storage');
  if (!values.cpu?.trim()) missing.push('CPU');
  return missing;
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