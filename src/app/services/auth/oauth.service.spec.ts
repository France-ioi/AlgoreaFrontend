import { TestBed } from '@angular/core/testing';
import { AuthHttpService } from '../../data-access/auth.http-service';
import { HttpClient } from '@angular/common/http';
import { APPCONFIG } from 'src/app/app.config';

describe('OauthService', () => {
  let authHttp: AuthHttpService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        { provide: APPCONFIG, useValue: { apiUrl: 'http://localhost:3000/api' } },
        {
          provide: HttpClient,
          useValue: {}
        }
      ]
    });
    authHttp = TestBed.inject(AuthHttpService);
  });

  it('should be created', () => {
    expect(authHttp).toBeTruthy();
  });
});
