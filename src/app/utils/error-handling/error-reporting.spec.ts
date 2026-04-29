import { HttpErrorResponse } from '@angular/common/http';
import { HTTPError, UnknownError } from './error-conversion';
import { reportAnError, sentryReporter } from './error-reporting';

describe('reportAnError', () => {
  let captureException: jasmine.Spy;

  beforeEach(() => {
    captureException = spyOn(sentryReporter, 'captureException').and.returnValue('event-id');
  });

  it('should pass Error instances through unchanged', () => {
    const err = new Error('boom');
    reportAnError(err);
    expect(captureException).toHaveBeenCalledOnceWith(err);
  });

  it('should wrap HttpErrorResponse into a HTTPError before capturing', () => {
    const httpErr = new HttpErrorResponse({ status: 500, statusText: 'KO', url: '/x' });
    reportAnError(httpErr);
    expect(captureException).toHaveBeenCalledTimes(1);
    expect(captureException.calls.mostRecent().args[0]).toEqual(jasmine.any(HTTPError));
  });

  it('should wrap unknown values into an UnknownError before capturing', () => {
    reportAnError({ some: 'plain object' });
    expect(captureException).toHaveBeenCalledTimes(1);
    expect(captureException.calls.mostRecent().args[0]).toEqual(jasmine.any(UnknownError));
  });
});
