import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Dialog } from '@angular/cdk/dialog';
import { BehaviorSubject, of, Subject } from 'rxjs';
import { LanguageMismatchComponent } from './language-mismatch.component';
import {
  LanguageMismatchModalComponent
} from './language-mismatch-modal/language-mismatch-modal.component';
import { UserSessionService } from '../../services/user-session.service';
import { LocaleService } from '../../services/localeService';
import { UserLanguageService } from '../../services/user-language.service';
import { CurrentUserProfile } from '../../data-access/current-user.service';

describe('LanguageMismatchComponent', () => {
  let fixture: ComponentFixture<LanguageMismatchComponent>;
  let userProfile$: BehaviorSubject<CurrentUserProfile>;
  let dialogOpen: jasmine.Spy;
  let setUserLanguage: jasmine.Spy;
  let navigatingToNewLanguage$: Subject<void>;

  const createProfile = (overrides: Partial<CurrentUserProfile>): CurrentUserProfile => ({
    groupId: '1',
    login: 'user',
    profile: {},
    defaultLanguage: 'en',
    tempUser: false,
    ...overrides,
  });

  function setup(options: {
    currentLanguage?: string,
    profile: CurrentUserProfile,
  }): void {
    navigatingToNewLanguage$ = new Subject<void>();
    userProfile$ = new BehaviorSubject(options.profile);
    dialogOpen = jasmine.createSpy('open');
    setUserLanguage = jasmine.createSpy('setUserLanguage').and.returnValue(of(undefined));

    TestBed.configureTestingModule({
      imports: [ LanguageMismatchComponent ],
      providers: [
        { provide: UserSessionService, useValue: { userProfile$ } },
        {
          provide: LocaleService,
          useValue: {
            languages: [ { tag: 'en' }, { tag: 'fr' } ],
            currentLang: options.currentLanguage ? { tag: options.currentLanguage } : undefined,
            navigatingToNewLanguage$,
          },
        },
        { provide: Dialog, useValue: { open: dialogOpen } },
        { provide: UserLanguageService, useValue: { setUserLanguage } },
      ],
    });

    fixture = TestBed.createComponent(LanguageMismatchComponent);
    fixture.detectChanges();
  }

  it('auto-updates language for temp user on mismatch without opening dialog', () => {
    setup({
      currentLanguage: 'en',
      profile: createProfile({ tempUser: true, defaultLanguage: 'fr' }),
    });

    expect(setUserLanguage).toHaveBeenCalledOnceWith('en');
    expect(dialogOpen).not.toHaveBeenCalled();
  });

  it('does nothing when temp user language already matches site language', () => {
    setup({
      currentLanguage: 'en',
      profile: createProfile({ tempUser: true, defaultLanguage: 'en' }),
    });

    expect(setUserLanguage).not.toHaveBeenCalled();
    expect(dialogOpen).not.toHaveBeenCalled();
  });

  it('opens mismatch modal for non-temp user without auto-updating language', () => {
    setup({
      currentLanguage: 'en',
      profile: createProfile({ tempUser: false, defaultLanguage: 'fr' }),
    });

    expect(setUserLanguage).not.toHaveBeenCalled();
    expect(dialogOpen).toHaveBeenCalledOnceWith(LanguageMismatchModalComponent, {
      disableClose: true,
      data: {
        userDefaultLanguage: 'fr',
        userDefaultLanguageIsSupported: true,
      },
    });
  });

  it('attempts auto-update only once per load even if a second mismatch arrives', () => {
    setup({
      currentLanguage: 'en',
      profile: createProfile({ tempUser: true, defaultLanguage: 'fr' }),
    });

    expect(setUserLanguage).toHaveBeenCalledOnceWith('en');

    userProfile$.next(createProfile({ tempUser: true, defaultLanguage: 'de', groupId: '2' }));
    expect(setUserLanguage).toHaveBeenCalledTimes(1);
  });
});
