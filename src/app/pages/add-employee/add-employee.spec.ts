import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Router, provideRouter } from '@angular/router';
import { vi } from 'vitest';

import { AddEmployee } from './add-employee';
import { NotificationService } from '../../core/notification.service';
import { environment } from '../../../environments/environment';

const USERS_URL = `${environment.apiUrl}/Users`;

describe('AddEmployee', () => {
  let component: AddEmployee;
  let fixture: ComponentFixture<AddEmployee>;
  let http: HttpTestingController;
  let notify: NotificationService;
  let el: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AddEmployee],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()]
    }).compileComponents();

    fixture = TestBed.createComponent(AddEmployee);
    component = fixture.componentInstance;
    el = fixture.nativeElement;
    http = TestBed.inject(HttpTestingController);
    notify = TestBed.inject(NotificationService);
    vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);

    fixture.detectChanges();
    http.expectOne(`${environment.apiUrl}/Departments`).flush([]);
    await fixture.whenStable();
  });

  afterEach(() => http.verify());

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('does not mark Email as required', () => {
    const label = Array.from(el.querySelectorAll('label')).find(l => l.textContent!.includes('Email'))!;
    expect(label.querySelector('span')).toBeNull();
  });

  it('saves an employee without an email', () => {
    component.fullName = 'No Email';
    component.employeeId = 'E-1';
    component.email = '   ';

    component.saveEmployee();

    const req = http.expectOne(USERS_URL);
    expect((req.request.body as FormData).get('Email')).toBe('');
    req.flush({ id: 1 });
  });

  it('rejects a badly formatted email when one is given', async () => {
    component.fullName = 'Bad Email';
    component.employeeId = 'E-2';
    component.email = 'not-an-email';

    component.saveEmployee();
    fixture.changeDetectorRef.detectChanges();
    await fixture.whenStable();

    http.expectNone(USERS_URL);
    expect(el.querySelector('.field-error')!.textContent!.trim()).toBe('Enter a valid email address, or leave it empty.');
    expect(notify.toast()?.message).toBe('Enter a valid email address, or leave it empty.');
  });

  it('marks Employee ID as required like Full Name', () => {
    const label = Array.from(el.querySelectorAll('label')).find(l => l.textContent!.includes('Employee ID'))!;
    expect(label.querySelector('span')?.textContent).toBe('*');
  });

  it('blocks Save without an Employee ID', async () => {
    component.fullName = 'No ID';
    component.employeeId = '   ';

    component.saveEmployee();
    fixture.changeDetectorRef.detectChanges();
    await fixture.whenStable();

    http.expectNone(USERS_URL);
    expect(el.querySelector('.field-error')!.textContent!.trim()).toBe('Employee ID is required.');
    expect(notify.toast()?.message).toBe('Employee ID is required.');
  });

  it('shows the 409 duplicate message under Employee ID and in the toast', async () => {
    component.fullName = 'Duplicate';
    component.employeeId = 'emp-001';

    component.saveEmployee();
    http.expectOne(USERS_URL).flush(
      { message: 'Employee ID emp-001 already exists' },
      { status: 409, statusText: 'Conflict' }
    );
    await fixture.whenStable();

    expect(el.querySelector('.field-error')!.textContent!.trim()).toBe('Employee ID emp-001 already exists');
    expect(notify.toast()?.message).toBe('Employee ID emp-001 already exists');
  });
});
