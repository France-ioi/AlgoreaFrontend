import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { APPCONFIG } from '../config';
import { ResultActionsService } from './result-actions.service';
import { ItemPath } from '../models/ids';

describe('ResultActionsService', () => {
  let service: ResultActionsService;
  let httpTestingController: HttpTestingController;
  const apiUrl = 'http://mock.api';
  const itemIdPath: ItemPath = [ '10', '1' ];

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptorsFromDi()),
        provideHttpClientTesting(),
        { provide: APPCONFIG, useValue: { apiUrl } },
      ],
    });
    service = TestBed.inject(ResultActionsService);
    httpTestingController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  it('POSTs start-result-path and emits the attempt id', () => {
    let attemptId: string | undefined;
    service.startWithoutAttempt(itemIdPath).subscribe(id => {
      attemptId = id;
    });

    const req = httpTestingController.expectOne(`${apiUrl}/items/10/1/start-result-path`);
    expect(req.request.method).toBe('POST');
    req.flush({ success: true, message: 'ok', data: { attempt_id: '42' } });

    expect(attemptId).toBe('42');
  });

  it('propagates HTTP errors from startWithoutAttempt', () => {
    let failed = false;
    service.startWithoutAttempt(itemIdPath).subscribe({
      error: () => {
        failed = true;
      },
    });

    const req = httpTestingController.expectOne(`${apiUrl}/items/10/1/start-result-path`);
    req.flush('forbidden', { status: 403, statusText: 'Forbidden' });

    expect(failed).toBeTrue();
  });
});
