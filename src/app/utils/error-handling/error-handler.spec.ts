import { HttpErrorResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { ChunkErrorService } from '../../services/chunk-error.service';
import { AlgErrorHandler } from './error-handler';
import { sentryReporter } from './error-reporting';

describe('AlgErrorHandler.handleError', () => {
  let handler: AlgErrorHandler;
  let chunkErrorService: jasmine.SpyObj<ChunkErrorService>;
  let captureException: jasmine.Spy;
  let showReportDialog: jasmine.Spy;

  beforeEach(() => {
    chunkErrorService = jasmine.createSpyObj<ChunkErrorService>('ChunkErrorService', [ 'emitError' ]);
    captureException = spyOn(sentryReporter, 'captureException').and.returnValue('event-id');
    showReportDialog = spyOn(sentryReporter, 'showReportDialog');

    TestBed.configureTestingModule({
      providers: [
        AlgErrorHandler,
        { provide: ChunkErrorService, useValue: chunkErrorService },
      ],
    });

    handler = TestBed.inject(AlgErrorHandler);
  });

  it('should emit on chunk loading errors and not capture', () => {
    handler.handleError(new Error('Loading chunk 42 failed'));
    expect(chunkErrorService.emitError).toHaveBeenCalledTimes(1);
    expect(captureException).not.toHaveBeenCalled();
    expect(showReportDialog).not.toHaveBeenCalled();
  });

  it('should ignore HttpErrorResponse (no capture, no dialog)', () => {
    handler.handleError(new HttpErrorResponse({ status: 0, statusText: 'Unknown', url: '/x' }));
    expect(captureException).not.toHaveBeenCalled();
    expect(showReportDialog).not.toHaveBeenCalled();
    expect(chunkErrorService.emitError).not.toHaveBeenCalled();
  });

  it('should capture and show the dialog for other errors', () => {
    handler.handleError(new Error('boom'));
    expect(captureException).toHaveBeenCalledTimes(1);
    expect(showReportDialog).toHaveBeenCalledTimes(1);
  });

  it('should not show the dialog twice for the same error', () => {
    handler.handleError(new Error('boom'));
    handler.handleError(new Error('boom'));
    expect(captureException).toHaveBeenCalledTimes(2);
    expect(showReportDialog).toHaveBeenCalledTimes(1);
  });
});
