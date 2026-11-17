import { Component } from '@angular/core';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Dialog, DialogRef } from '@angular/cdk/dialog';
import { ActivatedRoute, convertToParamMap, provideRouter, Router } from '@angular/router';
import { of, Subject } from 'rxjs';
import { APPCONFIG } from 'src/app/config';
import { CurrentUserProfile } from 'src/app/data-access/current-user.service';
import { ActionFeedbackService } from 'src/app/services/action-feedback.service';
import { UserSessionService } from 'src/app/services/user-session.service';
import { DeletePlatformUserDialogComponent } from './delete-platform-user-dialog.component';
import { DeletePlatformUserComponent } from './delete-platform-user.component';

@Component({ template: '' })
class MinePageStub {}

const apiUrl = 'http://mock.api';

function profile(): CurrentUserProfile {
  return {
    groupId: '42',
    login: 'Ada',
    profile: {},
    defaultLanguage: 'en',
    tempUser: false,
  };
}

function membership(locked: boolean): unknown {
  return {
    action: 'joined_by_code',
    group: {
      id: '50',
      name: 'Class',
      description: null,
      type: 'Class',
      require_personal_info_access_approval: 'none',
      require_watch_approval: false,
    },
    member_since: null,
    is_membership_locked: locked,
  };
}

describe('DeletePlatformUserComponent', () => {
  let fixture: ComponentFixture<DeletePlatformUserComponent>;
  let http: HttpTestingController;
  let logout: jasmine.Spy;
  let unexpectedError: jasmine.Spy;
  let dialogOpen: jasmine.Spy;
  let dialogClosed: Subject<boolean | undefined>;

  async function setup(query: Record<string, string> = {}, withMineRoute = true): Promise<void> {
    dialogClosed = new Subject<boolean | undefined>();
    logout = jasmine.createSpy('logout');
    unexpectedError = jasmine.createSpy('unexpectedError');
    dialogOpen = jasmine.createSpy('open').and.returnValue({ closed: dialogClosed } satisfies Pick<DialogRef<boolean>, 'closed'>);

    const paramMap = convertToParamMap(query);
    await TestBed.configureTestingModule({
      imports: [ DeletePlatformUserComponent ],
      providers: [
        provideHttpClient(withInterceptorsFromDi()),
        provideHttpClientTesting(),
        provideRouter(withMineRoute ? [ { path: 'groups/mine', component: MinePageStub } ] : []),
        { provide: APPCONFIG, useValue: { apiUrl } },
        {
          provide: ActivatedRoute,
          useValue: { queryParamMap: of(paramMap), snapshot: { queryParamMap: paramMap } },
        },
        { provide: UserSessionService, useValue: { userProfile$: of(profile()), logout } },
        { provide: ActionFeedbackService, useValue: { unexpectedError } },
        { provide: Dialog, useValue: { open: dialogOpen } },
      ],
    }).compileComponents();

    http = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(DeletePlatformUserComponent);
    fixture.detectChanges();
  }

  afterEach(() => {
    http.verify();
  });

  function deleteButton(): HTMLButtonElement | null {
    return fixture.nativeElement.querySelector('button.danger');
  }

  function flushMemberships(body: object | string | null, status = 200): void {
    const request = http.expectOne(`${apiUrl}/current-user/group-memberships`);
    request.flush(body, { status, statusText: status === 200 ? 'OK' : 'Error' });
    fixture.detectChanges();
  }

  function flushLoginCheck(matched: boolean, status = 200): void {
    const request = http.expectOne(req => req.url === `${apiUrl}/current-user/check-login-id`);
    request.flush(
      status === 200 ? { login_id_matched: matched } : { error_text: 'nope' },
      { status, statusText: status === 200 ? 'OK' : 'Error' },
    );
    fixture.detectChanges();
  }

  function confirmDeletion(): void {
    dialogClosed.next(true);
    dialogClosed.complete();
  }

  it('does not open the dialog while memberships are loading', async () => {
    await setup();

    deleteButton()?.click();

    expect(dialogOpen).not.toHaveBeenCalled();
    flushMemberships([]);
  });

  it('shows the locked-membership reason and does not open the dialog', async () => {
    await setup();
    flushMemberships([ membership(true) ]);

    deleteButton()?.click();

    expect(dialogOpen).not.toHaveBeenCalled();
    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('You are a member of groups you are not allowed to leave.');
    const link = fixture.nativeElement.querySelector('a') as HTMLAnchorElement;
    expect(link.getAttribute('href')).toBe('/groups/mine');
  });

  it('still opens the dialog when memberships fail to load', async () => {
    await setup();
    flushMemberships('nope', 500);

    deleteButton()?.click();

    expect(unexpectedError).not.toHaveBeenCalled();
    expect(dialogOpen).toHaveBeenCalledOnceWith(DeletePlatformUserDialogComponent, {
      data: { login: 'Ada' },
    });
  });

  it('opens the dialog when the user_id query matches the login id', async () => {
    await setup({ user_id: '99' });
    flushLoginCheck(true);
    flushMemberships([ membership(false) ]);

    deleteButton()?.click();

    expect(dialogOpen).toHaveBeenCalledOnceWith(DeletePlatformUserDialogComponent, {
      data: { login: 'Ada' },
    });
  });

  it('hides the button when the page was opened for another login', async () => {
    await setup({ user_id: '99' });
    flushLoginCheck(false);
    flushMemberships([]);

    expect(deleteButton()).toBeNull();
    expect(fixture.nativeElement.textContent).toContain(
      'This page was opened for another login. Sign in with that login to delete its data on this platform.',
    );
  });

  it('hides the button and reports an unexpected error when the login check fails', async () => {
    await setup({ user_id: '99' });
    flushLoginCheck(false, 500);
    flushMemberships([]);

    expect(unexpectedError).toHaveBeenCalled();
    expect(deleteButton()).toBeNull();
    expect(fixture.nativeElement.textContent).not.toContain('another login');
  });

  it('deletes the user after confirmation, then opens My groups and logs out', async () => {
    await setup();
    flushMemberships([ membership(false) ]);
    deleteButton()?.click();
    confirmDeletion();

    http.expectOne({ method: 'DELETE', url: `${apiUrl}/current-user` }).flush({ success: true, message: 'deleted' });
    await fixture.whenStable();

    expect(TestBed.inject(Router).url).toBe('/groups/mine');
    expect(logout).toHaveBeenCalled();
  });

  it('still logs out when My groups cannot be opened', async () => {
    await setup({}, false);
    flushMemberships([ membership(false) ]);
    deleteButton()?.click();
    confirmDeletion();

    http.expectOne({ method: 'DELETE', url: `${apiUrl}/current-user` }).flush({ success: true, message: 'deleted' });
    await fixture.whenStable();

    expect(logout).toHaveBeenCalled();
    expect(unexpectedError).not.toHaveBeenCalled();
  });

  it('stays and shows the locked-membership reason when deletion is refused', async () => {
    await setup();
    flushMemberships([ membership(false) ]);
    deleteButton()?.click();
    confirmDeletion();

    http.expectOne({ method: 'DELETE', url: `${apiUrl}/current-user` }).flush(
      { success: false, message: 'Forbidden', error_text: 'You cannot delete yourself right now' },
      { status: 403, statusText: 'Forbidden' },
    );
    await fixture.whenStable();
    fixture.detectChanges();

    expect(logout).not.toHaveBeenCalled();
    expect(TestBed.inject(Router).url).not.toBe('/groups/mine');
    expect(fixture.nativeElement.textContent).toContain('You are a member of groups you are not allowed to leave.');
  });

  it('logs out when the platform user is already deleted but unlinking the login fails', async () => {
    await setup();
    flushMemberships([ membership(false) ]);
    deleteButton()?.click();
    confirmDeletion();

    http.expectOne({ method: 'DELETE', url: `${apiUrl}/current-user` }).flush(
      { success: false, message: 'Internal Server Error', error_text: 'Login module failed' },
      { status: 500, statusText: 'Server Error' },
    );
    await fixture.whenStable();

    expect(TestBed.inject(Router).url).toBe('/groups/mine');
    expect(logout).toHaveBeenCalled();
    expect(unexpectedError).not.toHaveBeenCalled();
  });

  it('stays signed in and reports an unexpected error on any other deletion failure', async () => {
    await setup();
    flushMemberships([ membership(false) ]);
    deleteButton()?.click();
    confirmDeletion();

    http.expectOne({ method: 'DELETE', url: `${apiUrl}/current-user` }).flush(
      { success: false, message: 'Internal Server Error', error_text: 'database down' },
      { status: 500, statusText: 'Server Error' },
    );
    await fixture.whenStable();
    fixture.detectChanges();

    expect(logout).not.toHaveBeenCalled();
    expect(TestBed.inject(Router).url).not.toBe('/groups/mine');
    expect(unexpectedError).toHaveBeenCalled();
  });
});
