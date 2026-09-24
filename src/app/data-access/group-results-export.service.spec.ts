import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { of } from 'rxjs';
import { APPCONFIG } from '../config';
import { IdentityTokenService } from '../services/auth/identity-token.service';
import { GroupResultsExportService } from './group-results-export.service';

describe('GroupResultsExportService', () => {
  let service: GroupResultsExportService;
  let httpTestingController: HttpTestingController;

  const apiUrl = 'http://mock.api';
  const slsApiUrl = 'http://mock.sls';

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptorsFromDi()),
        provideHttpClientTesting(),
        { provide: APPCONFIG, useValue: { apiUrl, slsApiUrl } },
        { provide: IdentityTokenService, useValue: { identityToken$: of('identity-token') } },
      ],
    });
    service = TestBed.inject(GroupResultsExportService);
    httpTestingController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  it('should POST group-results-token and decode the response', () => {
    let result: { groupResultsToken: string, expiresIn: number } | undefined;

    service.getGroupResultsToken('42', [ '210', '220' ]).subscribe(data => {
      result = data;
    });

    const req = httpTestingController.expectOne(
      `${apiUrl}/groups/42/group-results-token?parent_item_ids=210,220`,
    );
    expect(req.request.method).toBe('POST');
    req.flush({
      success: true,
      message: 'ok',
      data: { group_results_token: 'token-abc', expires_in: 3600 },
    });

    expect(result).toEqual({ groupResultsToken: 'token-abc', expiresIn: 3600 });
  });

  it('should POST group-results-exports with the group results token', () => {
    let result: { exportId: string, expiresAt: number } | undefined;

    service.requestExport('group-token', '42', [ '210' ]).subscribe(data => {
      result = data;
    });

    const req = httpTestingController.expectOne(`${slsApiUrl}/group-results-exports`);
    expect(req.request.method).toBe('POST');
    expect(req.request.headers.get('Authorization')).toBe('Bearer group-token');
    expect(req.request.body).toEqual({ group_id: '42', parent_item_ids: [ '210' ] });
    req.flush({ export_id: 'exp-1', expires_at: 1893456000000 });

    expect(result).toEqual({ exportId: 'exp-1', expiresAt: 1893456000000 });
  });

  it('should GET download-url with the identity token and encode the export id', () => {
    let url: string | undefined;

    service.getDownloadUrl('exp/1').subscribe(value => {
      url = value;
    });

    const req = httpTestingController.expectOne(
      `${slsApiUrl}/group-results-exports/${encodeURIComponent('exp/1')}/download-url`,
    );
    expect(req.request.method).toBe('GET');
    expect(req.request.headers.get('Authorization')).toBe('Bearer identity-token');
    req.flush({ url: 'https://cdn.example/file.zip' });

    expect(url).toBe('https://cdn.example/file.zip');
  });

  it('should reject non-https download URLs', () => {
    let error: unknown;
    service.getDownloadUrl('exp-1').subscribe({
      error: err => {
        error = err;
      },
    });

    const req = httpTestingController.expectOne(`${slsApiUrl}/group-results-exports/exp-1/download-url`);
    req.flush({ url: 'http://insecure.example/file.zip' });

    expect(error).toBeTruthy();
  });
});
