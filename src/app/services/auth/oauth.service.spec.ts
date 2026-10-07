import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { AuthHttpService } from '../../data-access/auth.http-service';
import { APPCONFIG } from 'src/app/config';
import { OAuthService, OAuthStorageUnavailableError } from './oauth.service';

describe('OAuthService', () => {
  let service: OAuthService;
  let originalHref: string;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        {
          provide: APPCONFIG,
          useValue: {
            apiUrl: 'http://localhost:3000/api',
            oauthServerUrl: 'https://login.example.com',
            oauthClientId: '1',
          },
        },
        {
          provide: AuthHttpService,
          useValue: { createTokenFromCode: jasmine.createSpy('createTokenFromCode') },
        },
      ],
    });
    service = TestBed.inject(OAuthService);
    originalHref = location.href;
  });

  afterEach(() => {
    localStorage.removeItem('oauth_nonce');
    localStorage.removeItem('oauth_redirect_uri');
    history.replaceState(null, '', originalHref);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('throws OAuthStorageUnavailableError and does not redirect when setItem throws', () => {
    spyOn(Storage.prototype, 'setItem').and.throwError(new DOMException('The operation is insecure.', 'SecurityError'));

    expect(() => service.initCodeFlow()).toThrowError(OAuthStorageUnavailableError);
    expect(location.href).toBe(originalHref);
  });

  it('returns Invalid state received when getItem throws during code flow completion', async () => {
    history.replaceState(null, '', '?code=auth-code&state=nonce-value');
    spyOn(Storage.prototype, 'getItem').and.throwError(new DOMException('The operation is insecure.', 'SecurityError'));

    await expectAsync(firstValueFrom(service.tryCompletingCodeFlowLogin())).toBeRejectedWithError(
      'Invalid state received',
    );
  });
});
