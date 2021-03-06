import { TestBed } from '@angular/core/testing';

import { AuthService } from './auth.service';
import { AuthHttpService } from '../http-services/auth.http-service';
import { HttpBackend } from '@angular/common/http';

describe('AuthService', () => {
  let authService: AuthService;
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
    authHttp = TestBed.inject(AuthHttpService);
  });

  it('should be created', () => {
    expect(authService).toBeTruthy();
    expect(authHttp).toBeTruthy();
  });
});
