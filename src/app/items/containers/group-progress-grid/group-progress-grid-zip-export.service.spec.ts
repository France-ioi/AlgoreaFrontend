import { TestBed } from '@angular/core/testing';
import { HttpErrorResponse, HttpHeaders, HttpResponse } from '@angular/common/http';
import { Subject, config as rxjsConfig, of, throwError } from 'rxjs';
import { ActionFeedbackService } from 'src/app/services/action-feedback.service';
import { ProgressZipService } from 'src/app/data-access/progress-zip.service';
import { GroupProgressGridZipExportService } from './group-progress-grid-zip-export.service';

describe('GroupProgressGridZipExportService', () => {
  let service: GroupProgressGridZipExportService;
  let progressZipService: jasmine.SpyObj<ProgressZipService>;
  let actionFeedbackService: jasmine.SpyObj<ActionFeedbackService>;

  beforeEach(() => {
    progressZipService = jasmine.createSpyObj('ProgressZipService', [ 'getZipData' ]);
    actionFeedbackService = jasmine.createSpyObj('ActionFeedbackService', [ 'error', 'unexpectedError' ]);

    TestBed.configureTestingModule({
      providers: [
        GroupProgressGridZipExportService,
        { provide: ProgressZipService, useValue: progressZipService },
        { provide: ActionFeedbackService, useValue: actionFeedbackService },
      ],
    });
    service = TestBed.inject(GroupProgressGridZipExportService);
  });

  it('triggers download with parsed filename on success', () => {
    const blob = new Blob([ 'zip-content' ], { type: 'application/zip' });
    const response = new HttpResponse({
      body: blob,
      headers: new HttpHeaders({ 'Content-Disposition': 'attachment; filename="custom-export.zip"' }),
    });
    progressZipService.getZipData.and.returnValue(of(response));
    const clickSpy = spyOn(HTMLAnchorElement.prototype, 'click').and.stub();
    const createElementSpy = spyOn(document, 'createElement').and.callThrough();

    service.export('42', '210');

    expect(createElementSpy).toHaveBeenCalledWith('a');
    const anchor = createElementSpy.calls.mostRecent().returnValue as HTMLAnchorElement;
    expect(anchor.download).toBe('custom-export.zip');
    expect(clickSpy).toHaveBeenCalled();
    expect(service.isFetching()).toBe(false);
  });

  it('throws on empty response body', async () => {
    progressZipService.getZipData.and.returnValue(of(new HttpResponse<Blob>({ body: null })));
    const previousHandler = rxjsConfig.onUnhandledError;
    const errorPromise = new Promise<unknown>(resolve => {
      rxjsConfig.onUnhandledError = resolve;
    });

    service.export('42', '210');
    const error = await errorPromise;
    rxjsConfig.onUnhandledError = previousHandler;

    expect(String(error)).toMatch(/empty ZIP response body/);
    expect(service.isFetching()).toBe(false);
  });

  it('toggles isFetching via finalize', () => {
    const response$ = new Subject<HttpResponse<Blob>>();
    progressZipService.getZipData.and.returnValue(response$.asObservable());

    service.export('42', '210');
    expect(service.isFetching()).toBe(true);

    response$.next(new HttpResponse({ body: new Blob([ 'zip' ]) }));
    response$.complete();

    expect(service.isFetching()).toBe(false);
  });

  it('routes blob HTTP errors to actionFeedbackService.error with mapped message', async () => {
    const errorBlob = new Blob(
      [ JSON.stringify({ error_text: 'Insufficient access rights' }) ],
      { type: 'application/json' },
    );
    const httpError = new HttpErrorResponse({
      error: errorBlob,
      status: 403,
      statusText: 'Forbidden',
    });
    progressZipService.getZipData.and.returnValue(throwError(() => httpError));

    service.export('42', '210');
    await new Promise<void>(resolve => setTimeout(resolve, 50));

    expect(actionFeedbackService.error).toHaveBeenCalledWith(
      jasmine.stringMatching(/permission to export answers/i),
      undefined,
    );
    expect(actionFeedbackService.unexpectedError).not.toHaveBeenCalled();
    expect(service.isFetching()).toBe(false);
  });
});
