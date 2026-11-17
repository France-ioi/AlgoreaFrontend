import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { BehaviorSubject } from 'rxjs';
import { filter } from 'rxjs/operators';
import { CurrentUserProfile } from 'src/app/data-access/current-user.service';
import { UserSessionService } from 'src/app/services/user-session.service';
import { isNotUndefined } from 'src/app/utils/null-undefined-predicates';
import { currentUserPathGuard } from './current-user-path.guard';

function profile(overrides: Partial<CurrentUserProfile> = {}): CurrentUserProfile {
  return {
    groupId: '42',
    login: 'Ada',
    profile: {},
    defaultLanguage: 'en',
    tempUser: false,
    ...overrides,
  };
}

describe('currentUserPathGuard', () => {
  let userProfile$: BehaviorSubject<CurrentUserProfile | undefined>;
  let login: jasmine.Spy;

  beforeEach(() => {
    userProfile$ = new BehaviorSubject<CurrentUserProfile | undefined>(undefined);
    login = jasmine.createSpy('login');
    TestBed.configureTestingModule({
      providers: [
        provideRouter([
          {
            path: 'groups/users/me',
            canActivate: [ currentUserPathGuard ],
            children: [
              { path: 'settings', children: [] },
              { path: 'personal-data', children: [] },
            ],
          },
          {
            path: 'groups/users/:id',
            children: [
              { path: 'settings', children: [] },
              { path: 'personal-data', children: [] },
            ],
          },
        ]),
        {
          provide: UserSessionService,
          useValue: {
            userProfile$: userProfile$.pipe(filter(isNotUndefined)),
            login,
          },
        },
      ],
    });
  });

  it('starts login for a temporary session and does not open the me page', async () => {
    const router = TestBed.inject(Router);
    userProfile$.next(profile({ tempUser: true, groupId: '7', login: 'tmp-7' }));

    const navigated = await router.navigateByUrl('/groups/users/me/settings?module=collected_data&user_id=7');

    expect(navigated).toBeFalse();
    expect(login).toHaveBeenCalled();
    expect(router.url).not.toContain('/groups/users/7');
  });

  it('replaces me with the signed-in group id and keeps the query', async () => {
    const router = TestBed.inject(Router);
    userProfile$.next(profile({ groupId: '42', login: 'Ada' }));

    const navigated = await router.navigateByUrl('/groups/users/me/settings?module=collected_data&user_id=99');

    expect(navigated).toBeTrue();
    expect(router.url).toBe('/groups/users/42/settings?module=collected_data&user_id=99');
    expect(router.lastSuccessfulNavigation()?.extras.replaceUrl).toBeTrue();
    expect(login).not.toHaveBeenCalled();
  });
});
