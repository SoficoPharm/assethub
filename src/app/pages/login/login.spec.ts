import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Router, provideRouter } from '@angular/router';
import { vi } from 'vitest';

import { Login } from './login';
import { authInterceptor } from '../../core/auth.interceptor';
import { environment } from '../../../environments/environment';

const LOGIN_URL = `${environment.apiUrl}/Auth/login`;

describe('Login', () => {
  let fixture: ComponentFixture<Login>;
  let http: HttpTestingController;
  let router: Router;
  let el: HTMLElement;

  const errorText = () => el.querySelector('.error-box')?.textContent?.trim() ?? '';
  const spinnerShown = () => !!el.querySelector('.spinner');

  // `wait` = false renders synchronously; whenStable() would hang under fake timers.
  async function submit(userName = 'superadmin', password = 'wrong-password', wait = true) {
    const user = el.querySelector<HTMLInputElement>('#email')!;
    const pass = el.querySelector<HTMLInputElement>('#password')!;
    user.value = userName;
    user.dispatchEvent(new Event('input'));
    pass.value = password;
    pass.dispatchEvent(new Event('input'));
    el.querySelector<HTMLFormElement>('form')!.dispatchEvent(new Event('submit'));
    if (wait) await fixture.whenStable();
    else fixture.detectChanges();
  }

  beforeEach(async () => {
    localStorage.clear();

    await TestBed.configureTestingModule({
      imports: [Login],
      providers: [
        provideRouter([]),
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting()
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(Login);
    el = fixture.nativeElement;
    http = TestBed.inject(HttpTestingController);
    router = TestBed.inject(Router);
    vi.spyOn(router, 'navigate').mockResolvedValue(true);
    await fixture.whenStable();
  });

  afterEach(() => {
    http.verify();
    vi.useRealTimers();
  });

  it('shows the spinner while waiting, then the 401 message as soon as the response arrives', async () => {
    await submit();
    expect(spinnerShown()).toBe(true);

    http.expectOne(LOGIN_URL).flush({ message: 'Invalid username or password' }, { status: 401, statusText: 'Unauthorized' });
    await fixture.whenStable();

    expect(spinnerShown()).toBe(false);
    expect(errorText()).toBe('Invalid username or password');
    expect(router.navigate).not.toHaveBeenCalled();
  });

  it('does not log out or redirect on a 401 from the login request itself', async () => {
    const logoutSpy = vi.spyOn(Storage.prototype, 'removeItem');

    await submit();
    http.expectOne(LOGIN_URL).flush({ message: 'Invalid username or password' }, { status: 401, statusText: 'Unauthorized' });
    await fixture.whenStable();

    expect(router.navigate).not.toHaveBeenCalledWith(['/login']);
    expect(logoutSpy).not.toHaveBeenCalled();
  });

  it('does not send an Authorization header with the login request', async () => {
    localStorage.setItem('token', 'stale-token');
    await submit();

    const req = http.expectOne(LOGIN_URL);
    expect(req.request.headers.has('Authorization')).toBe(false);
    req.flush({ message: 'Invalid username or password' }, { status: 401, statusText: 'Unauthorized' });
    await fixture.whenStable();
  });

  it('shows the disabled-account message on 403', async () => {
    await submit();
    http.expectOne(LOGIN_URL).flush(
      { message: 'Your account is disabled. Contact the IT Helpdesk.' },
      { status: 403, statusText: 'Forbidden' }
    );
    await fixture.whenStable();

    expect(spinnerShown()).toBe(false);
    expect(errorText()).toBe('Your account is disabled. Contact the IT Helpdesk.');
  });

  it('clears the error when the user types again', async () => {
    await submit();
    http.expectOne(LOGIN_URL).flush({ message: 'Invalid username or password' }, { status: 401, statusText: 'Unauthorized' });
    await fixture.whenStable();
    expect(errorText()).not.toBe('');

    const pass = el.querySelector<HTMLInputElement>('#password')!;
    pass.value = 'something-else';
    pass.dispatchEvent(new Event('input'));
    await fixture.whenStable();

    expect(errorText()).toBe('');
  });

  it('shows "Cannot connect" when the API is unreachable (status 0)', async () => {
    await submit();
    http.expectOne(LOGIN_URL).error(new ProgressEvent('error'), { status: 0, statusText: 'Unknown Error' });
    await fixture.whenStable();

    expect(spinnerShown()).toBe(false);
    expect(errorText()).toBe('Cannot connect to the server. Try again later.');
  });

  it('shows "Cannot connect" when the API does not answer within 10 seconds', async () => {
    vi.useFakeTimers();
    await submit('superadmin', 'any-password', false);
    const req = http.expectOne(LOGIN_URL);

    vi.advanceTimersByTime(9_999);
    fixture.detectChanges();
    expect(spinnerShown()).toBe(true);

    vi.advanceTimersByTime(1);
    fixture.detectChanges();

    expect(req.cancelled).toBe(true);
    expect(spinnerShown()).toBe(false);
    expect(errorText()).toBe('Cannot connect to the server. Try again later.');
  });

  it('goes to /dashboard on a correct password', async () => {
    await submit('superadmin', 'correct-password');
    http.expectOne(LOGIN_URL).flush({
      token: 'header.eyJleHAiOjk5OTk5OTk5OTl9.sig',
      user: { id: 1, fullName: 'Super Admin', userName: 'superadmin', role: 'SuperAdmin' }
    });
    await fixture.whenStable();

    expect(router.navigate).toHaveBeenCalledWith(['/dashboard']);
    expect(errorText()).toBe('');
    expect(localStorage.getItem('token')).toBe('header.eyJleHAiOjk5OTk5OTk5OTl9.sig');
  });
});
