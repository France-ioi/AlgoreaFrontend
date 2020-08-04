import { TestBed } from '@angular/core/testing';

import { AuthService } from './auth.service';
import { TempAuthService } from './temp-auth.service';
import { AuthHttpService } from '../http-services/auth.http-service';
import { HttpBackend } from '@angular/common/http';

describe('AuthService', () => {
  let authService: AuthService;
  let tempAuthService: TempAuthService;
  let authHttp: AuthHttpService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        {
          provide: HttpBackend,
          useValue: {}
        }
      ]
    });
    authService = TestBed.inject(AuthService);
    tempAuthService = TestBed.inject(TempAuthService);
    authHttp = TestBed.inject(AuthHttpService);
  });

  it('should be created', () => {
    expect(authService).toBeTruthy();
    expect(tempAuthService).toBeTruthy();
    expect(authHttp).toBeTruthy();
  });
});
