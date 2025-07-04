import { catchError, map, Observable } from 'rxjs';
import { APPCONFIG } from '../config';
import { inject } from '@angular/core';
import { decodeSnakeCase } from 'src/app/utils/operators/decode';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { z } from 'zod';
import { errorIsBadRequest } from 'src/app/utils/errors';
import { itemTypeSchema } from '../items/models/item-type';

const breadcrumbsFromRootElementSchema = z.object({
  id: z.string(),
  languageTag: z.string(),
  title: z.string(),
  type: itemTypeSchema,
});

export type BreadcrumbsFromRootElement = z.infer<typeof breadcrumbsFromRootElementSchema>;

const breadcrumbsFromRootSchema = z.object({
  path: z.array(breadcrumbsFromRootElementSchema)
});

const breadcrumbsListSchema = z.array(breadcrumbsFromRootSchema);

@Injectable({
  providedIn: 'root',
})
export class GetBreadcrumbsFromRootsService {
  private config = inject(APPCONFIG);

  constructor(private http: HttpClient) {
  }

  get(id: string): Observable<BreadcrumbsFromRootElement[][]> {
    return this.http.get<unknown>(`${this.config.apiUrl}/items/${id}/breadcrumbs-from-roots`).pipe(
      decodeSnakeCase(breadcrumbsListSchema),
      map(l => l.map(e => e.path))
    );
  }

  getByTextId(textId: string): Observable<BreadcrumbsFromRootElement[][]> {
    return this.http.get<unknown>(`${this.config.apiUrl}/items/by-text-id/${encodeURIComponent(textId)}/breadcrumbs-from-roots`).pipe(
      catchError(err => {
        // convert a specific 400 error to 403
        if (!(err instanceof HttpErrorResponse) || !errorIsBadRequest(err)) throw err;
        const errorBody: unknown = err.error;
        if (typeof errorBody !== 'object' || errorBody === null || !('error_text' in errorBody)) throw err;
        const errorText = errorBody.error_text;
        if (typeof errorText === 'string' && /No item found with text_id/.test(errorText)) throw new HttpErrorResponse({ status: 403 });
        throw err;
      }),
      decodeSnakeCase(breadcrumbsListSchema),
      map(l => l.map(e => e.path))
    );
  }
}
