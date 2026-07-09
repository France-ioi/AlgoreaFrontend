import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { APPCONFIG } from '../config';
import { ProgressZipService } from './progress-zip.service';

describe('ProgressZipService', () => {
  let service: ProgressZipService;
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
    service = TestBed.inject(ProgressZipService);
    httpTestingController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  it('should GET group progress with answers zip', () => {
    const blob = new Blob([ 'zip-content' ], { type: 'application/zip' });
    let responseBody: Blob | null | undefined;

    service.getZipData('42', [ '210', '220' ]).subscribe(response => {
      responseBody = response.body;
    });

    const req = httpTestingController.expectOne(
      `${apiUrl}/groups/42/group-progress-with-answers-zip?parent_item_ids=210,220`,
    );
    expect(req.request.method).toBe('GET');
    expect(req.request.responseType).toBe('blob');
    req.flush(blob, {
      status: 200,
      statusText: 'OK',
      headers: { 'Content-Disposition': 'attachment; filename=test.zip' },
    });

    expect(responseBody).toEqual(blob);
  });
});
