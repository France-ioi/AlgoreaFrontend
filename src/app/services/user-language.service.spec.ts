import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { UserLanguageService } from './user-language.service';
import { UserSessionService } from './user-session.service';
import { CurrentContentService } from './current-content.service';

describe('UserLanguageService', () => {
  let service: UserLanguageService;
  let updateCurrentUser: jasmine.Spy;
  let forceNavMenuReload: jasmine.Spy;

  beforeEach(() => {
    updateCurrentUser = jasmine.createSpy('updateCurrentUser');
    forceNavMenuReload = jasmine.createSpy('forceNavMenuReload');

    TestBed.configureTestingModule({
      providers: [
        UserLanguageService,
        { provide: UserSessionService, useValue: { updateCurrentUser } },
        { provide: CurrentContentService, useValue: { forceNavMenuReload } },
      ],
    });

    service = TestBed.inject(UserLanguageService);
  });

  it('forces nav menu reload after successful language update', () => {
    updateCurrentUser.and.returnValue(of(undefined));

    service.setUserLanguage('fr').subscribe();

    expect(updateCurrentUser).toHaveBeenCalledOnceWith({ default_language: 'fr' });
    expect(forceNavMenuReload).toHaveBeenCalledTimes(1);
  });

  it('does not force nav menu reload when update fails', () => {
    updateCurrentUser.and.returnValue(throwError(() => new Error('update failed')));

    service.setUserLanguage('fr').subscribe({ error: () => undefined });

    expect(updateCurrentUser).toHaveBeenCalledOnceWith({ default_language: 'fr' });
    expect(forceNavMenuReload).not.toHaveBeenCalled();
  });
});
