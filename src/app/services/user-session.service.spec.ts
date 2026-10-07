import { TestBed } from '@angular/core/testing';
import { BehaviorSubject, EMPTY } from 'rxjs';
import { AuthService } from './auth/auth.service';
import { OAuthStorageUnavailableError } from './auth/oauth.service';
import { CurrentUserHttpService } from '../data-access/current-user.service';
import { ActionFeedbackService } from './action-feedback.service';
import { UserSessionService } from './user-session.service';
import { notAuthenticated } from './auth/auth-info';
import { SECONDS } from '../utils/duration';

describe('UserSessionService', () => {
  let service: UserSessionService;
  let startAuthLogin: jasmine.Spy;
  let actionFeedbackError: jasmine.Spy;

  beforeEach(() => {
    startAuthLogin = jasmine.createSpy('startAuthLogin');
    actionFeedbackError = jasmine.createSpy('error');

    TestBed.configureTestingModule({
      providers: [
        UserSessionService,
        {
          provide: AuthService,
          useValue: {
            startAuthLogin,
            logoutAuthUser: jasmine.createSpy('logoutAuthUser'),
            status$: new BehaviorSubject(notAuthenticated()),
          },
        },
        {
          provide: CurrentUserHttpService,
          useValue: {
            getProfileInfo: (): typeof EMPTY => EMPTY,
            update: jasmine.createSpy('update'),
            refresh: jasmine.createSpy('refresh'),
          },
        },
        {
          provide: ActionFeedbackService,
          useValue: { error: actionFeedbackError },
        },
      ],
    });
    service = TestBed.inject(UserSessionService);
  });

  afterEach(() => {
    service.ngOnDestroy();
  });

  it('shows feedback when OAuth storage is unavailable on login', () => {
    startAuthLogin.and.callFake((): void => {
      throw new OAuthStorageUnavailableError();
    });

    service.login();

    expect(actionFeedbackError).toHaveBeenCalledTimes(1);
    expect(actionFeedbackError.calls.mostRecent().args[0]).toContain('blocking storage');
    expect(actionFeedbackError.calls.mostRecent().args[1]).toEqual({ life: 20 * SECONDS });
  });

  it('rethrows non-storage errors from login', () => {
    startAuthLogin.and.callFake((): void => {
      throw new Error('unexpected boom');
    });

    expect(() => service.login()).toThrowError('unexpected boom');
    expect(actionFeedbackError).not.toHaveBeenCalled();
  });
});
