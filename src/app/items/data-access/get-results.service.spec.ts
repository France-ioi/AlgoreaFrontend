import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { APPCONFIG } from 'src/app/config';
import { GetResultsService } from './get-results.service';
import { itemRoute, newAttemptId } from 'src/app/models/routing/item-route';

describe('GetResultsService', () => {
  let service: GetResultsService;
  let httpTestingController: HttpTestingController;
  const apiUrl = 'http://mock.api';

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptorsFromDi()),
        provideHttpClientTesting(),
        { provide: APPCONFIG, useValue: { apiUrl } },
      ],
    });
    service = TestBed.inject(GetResultsService);
    httpTestingController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  it('sends parent_attempt_id when the route has a parent attempt', () => {
    const route = itemRoute('activity', '1', { path: [], parentAttemptId: '0' });
    service.getResults(route).subscribe();

    const req = httpTestingController.expectOne(
      r => r.url === `${apiUrl}/items/1/attempts` && r.method === 'GET',
    );
    expect(req.request.params.get('parent_attempt_id')).toBe('0');
    expect(req.request.params.has('attempt_id')).toBeFalse();
    req.flush([]);
  });

  it('prefers parent_attempt_id when the route has both parent and self attempt', () => {
    const route = itemRoute('activity', '1', { path: [], parentAttemptId: '0', attemptId: '42' });
    service.getResults(route).subscribe();

    const req = httpTestingController.expectOne(
      r => r.url === `${apiUrl}/items/1/attempts` && r.method === 'GET',
    );
    expect(req.request.params.get('parent_attempt_id')).toBe('0');
    expect(req.request.params.has('attempt_id')).toBeFalse();
    req.flush([]);
  });

  it('sends attempt_id when the route has only a self attempt', () => {
    const route = itemRoute('activity', '1', { path: [], attemptId: '42' });
    service.getResults(route).subscribe();

    const req = httpTestingController.expectOne(
      r => r.url === `${apiUrl}/items/1/attempts` && r.method === 'GET',
    );
    expect(req.request.params.get('attempt_id')).toBe('42');
    expect(req.request.params.has('parent_attempt_id')).toBeFalse();
    req.flush([]);
  });

  it('uses parent_attempt_id when a=new is paired with a parent attempt', () => {
    const route = itemRoute('activity', '1', { path: [], parentAttemptId: '0', attemptId: newAttemptId });
    service.getResults(route).subscribe();

    const req = httpTestingController.expectOne(
      r => r.url === `${apiUrl}/items/1/attempts` && r.method === 'GET',
    );
    expect(req.request.params.get('parent_attempt_id')).toBe('0');
    expect(req.request.params.has('attempt_id')).toBeFalse();
    req.flush([]);
  });

  it('throws when the route has only the a=new sentinel', () => {
    const route = itemRoute('activity', '1', { path: [], attemptId: newAttemptId });
    expect(() => service.getResults(route).subscribe()).toThrowError(
      /Cannot fetch results without a parent or self attempt/,
    );
  });
});
