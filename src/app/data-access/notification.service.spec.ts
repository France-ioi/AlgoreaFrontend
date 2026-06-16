import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient, withInterceptorsFromDi, withXhr } from '@angular/common/http';
import { of } from 'rxjs';
import { APPCONFIG } from '../config';
import { IdentityTokenService } from '../services/auth/identity-token.service';
import { Notification } from '../models/notification';
import { NotificationHttpService } from './notification.service';

describe('NotificationHttpService', () => {
  let service: NotificationHttpService;
  let httpTestingController: HttpTestingController;

  const slsApiUrl = 'http://mock.sls';

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withXhr(), withInterceptorsFromDi()),
        provideHttpClientTesting(),
        { provide: APPCONFIG, useValue: { apiUrl: 'http://mock.api', slsApiUrl } },
        { provide: IdentityTokenService, useValue: { identityToken$: of('mock-token') } },
      ],
    });
    service = TestBed.inject(NotificationHttpService);
    httpTestingController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should retry getNotifications on a transient 503 and succeed on the second attempt', () => {
    jasmine.clock().install();
    try {
      let result: Notification[] | undefined;
      let error: unknown;
      service.getNotifications().subscribe({
        next: notifications => {
          result = notifications;
        },
        error: err => {
          error = err;
        },
      });

      const firstReq = httpTestingController.expectOne(`${slsApiUrl}/notifications`);
      expect(firstReq.request.method).toBe('GET');
      firstReq.flush('', { status: 503, statusText: 'Service Unavailable' });

      jasmine.clock().tick(200);

      const secondReq = httpTestingController.expectOne(`${slsApiUrl}/notifications`);
      expect(secondReq.request.method).toBe('GET');
      secondReq.flush({ notifications: [] });

      expect(error).toBeUndefined();
      expect(result).toEqual([]);
    } finally {
      jasmine.clock().uninstall();
    }
  });
});
