import { HttpErrorResponse } from '@angular/common/http';
import { readHttpBlobError } from './http-blob-error';

describe('readHttpBlobError', () => {
  it('rethrows non-HttpErrorResponse errors', async () => {
    const error = new Error('boom');
    await expectAsync(readHttpBlobError(error)).toBeRejectedWith(error);
  });

  it('parses Blob body with valid JSON error_text', async () => {
    const blob = new Blob(
      [ JSON.stringify({ error_text: 'Insufficient access rights' }) ],
      { type: 'application/json' },
    );
    const error = new HttpErrorResponse({ error: blob, status: 403 });

    await expectAsync(readHttpBlobError(error)).toBeResolvedTo({
      status: 403,
      errorText: 'Insufficient access rights',
    });
  });

  it('returns status only when Blob body is invalid JSON', async () => {
    const blob = new Blob([ 'not-json' ], { type: 'application/json' });
    const error = new HttpErrorResponse({ error: blob, status: 400 });

    await expectAsync(readHttpBlobError(error)).toBeResolvedTo({ status: 400 });
  });

  it('returns status only when Blob body JSON fails schema validation', async () => {
    const blob = new Blob([ JSON.stringify({ error_text: 123 }) ], { type: 'application/json' });
    const error = new HttpErrorResponse({ error: blob, status: 400 });

    await expectAsync(readHttpBlobError(error)).toBeResolvedTo({ status: 400 });
  });

  it('returns status only for non-Blob error body', async () => {
    const error = new HttpErrorResponse({ error: { message: 'fail' }, status: 500 });

    await expectAsync(readHttpBlobError(error)).toBeResolvedTo({ status: 500 });
  });

  it('returns status without errorText when JSON omits error_text', async () => {
    const blob = new Blob([ JSON.stringify({ success: false, message: 'Bad Request' }) ], { type: 'application/json' });
    const error = new HttpErrorResponse({ error: blob, status: 400 });

    await expectAsync(readHttpBlobError(error)).toBeResolvedTo({ status: 400, errorText: undefined });
  });
});
