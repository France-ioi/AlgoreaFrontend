import { HttpErrorResponse } from '@angular/common/http';
import { z } from 'zod';

const blobErrorSchema = z.object({
  error_text: z.string().optional(),
});

/**
 * Extract HTTP status and optional `error_text` from a failed download whose body was requested as a Blob.
 *
 * Angular HttpClient returns error bodies as `Blob` when `responseType: 'blob'`; this helper reads and
 * parses the JSON envelope `{ error_text?: string }` used by Algorea action/download endpoints.
 * Re-throws non-`HttpErrorResponse` values unchanged. On parse failure, returns `{ status }` only.
 */
export async function readHttpBlobError(error: unknown): Promise<{ status: number, errorText?: string }> {
  if (!(error instanceof HttpErrorResponse)) {
    throw error;
  }

  if (error.error instanceof Blob) {
    try {
      // Blob.text() is async; this helper must stay async even though callers use RxJS from().
      const text = await error.error.text();
      const parsed = blobErrorSchema.safeParse(JSON.parse(text));
      if (parsed.success) {
        return { status: error.status, errorText: parsed.data.error_text };
      }
      return { status: error.status };
    } catch {
      return { status: error.status };
    }
  }

  return { status: error.status };
}
