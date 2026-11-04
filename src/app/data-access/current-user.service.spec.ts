import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { APPCONFIG } from '../config';
import { CurrentUserHttpService, CurrentUserProfile } from './current-user.service';

describe('CurrentUserHttpService', () => {
  let service: CurrentUserHttpService;
  let http: HttpTestingController;
  const apiUrl = 'http://mock.api';

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptorsFromDi()),
        provideHttpClientTesting(),
        { provide: APPCONFIG, useValue: { apiUrl } },
      ],
    });
    service = TestBed.inject(CurrentUserHttpService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http.verify();
  });

  it('reads the slim current-user contract and names from profile', () => {
    let result: CurrentUserProfile | undefined;
    service.getProfileInfo().subscribe(profile => {
      result = profile;
    });

    http.expectOne(`${apiUrl}/current-user`).flush({
      group_id: '2',
      login: 'ada',
      temp_user: false,
      default_language: 'en',
      profile: { first_name: 'Ada', last_name: 'Lovelace', email: 'ada@example.com' },
      email: 'ignored@example.com',
      grade: null,
      free_text: 'hello',
    });

    expect(result).toEqual({
      groupId: '2',
      login: 'ada',
      tempUser: false,
      defaultLanguage: 'en',
      profile: { firstName: 'Ada', lastName: 'Lovelace' },
    });
  });

  it('treats a missing profile as an empty profile', () => {
    let result: CurrentUserProfile | undefined;
    service.getProfileInfo().subscribe(profile => {
      result = profile;
    });

    http.expectOne(`${apiUrl}/current-user`).flush({
      group_id: '3',
      login: 'jane',
      temp_user: true,
      default_language: 'fr',
      profile: null,
    });

    expect(result?.profile).toEqual({});
    expect(result?.tempUser).toBeTrue();
  });
});
