import { TestBed } from '@angular/core/testing';
import { APPCONFIG } from 'src/app/app.config';

import { AuthService } from './auth.service';
import { AuthHttpService } from '../../data-access/auth.http-service';
import { LocaleService } from 'src/app/services/localeService';
import { EMPTY } from 'rxjs';

describe('AuthService', () => {
  let authService: AuthService;
  let authHttp: AuthHttpService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        { provide: APPCONFIG, useValue: { apiUrl: 'http://localhost:3000/api' } },
        {
          provide: AuthHttpService,
          useValue: {
            createTempUser: () => EMPTY
          }
        },
        {
          provide: LocaleService,
          useValue: {
            currentLang: { tag: 'fr' }
          }
        }
      ]
    });
    authService = TestBed.inject(AuthService);
    authHttp = TestBed.inject(AuthHttpService);
  });

  afterEach(() => {
    authService.ngOnDestroy();
  });

  it('should be created', () => {
    expect(authService).toBeTruthy();
    expect(authHttp).toBeTruthy();
  });
});
