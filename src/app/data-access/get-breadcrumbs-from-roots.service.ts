import { catchError, map, Observable } from 'rxjs';
import { appConfig } from 'src/app/utils/config';
import { decodeSnakeCase } from 'src/app/utils/operators/decode';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import * as D from 'io-ts/Decoder';
import { errorIsBadRequest } from 'src/app/utils/errors';

const breadcrumbsFromRootElementDecoder = D.struct({
  id: D.string,
  languageTag: D.string,
  title: D.string,
  type: D.literal('Chapter','Task','Skill'),
});

export type BreadcrumbsFromRootElement = D.TypeOf<typeof breadcrumbsFromRootElementDecoder>;

const breadcrumbsFromRootDecoder = D.struct({
  startedByParticipant: D.boolean,
  path: D.array(breadcrumbsFromRootElementDecoder)
});

const breadcrumbsListDecoder = D.array(breadcrumbsFromRootDecoder);

@Injectable({
  providedIn: 'root',
})
export class GetBreadcrumbsFromRootsService {
  constructor(private http: HttpClient) {
  }

  get(id: string): Observable<BreadcrumbsFromRootElement[][]> {
    return this.http.get<unknown>(`${appConfig.apiUrl}/items/${id}/breadcrumbs-from-roots`).pipe(
      decodeSnakeCase(breadcrumbsListDecoder),
      map(l => l.map(e => e.path))
    );
  }

  getByTextId(textId: string): Observable<BreadcrumbsFromRootElement[][]> {
    return this.http.get<unknown>(`${appConfig.apiUrl}/items/by-text-id/${encodeURIComponent(textId)}/breadcrumbs-from-roots`).pipe(
      catchError(err => {
        // convert a specific 400 error to 403
        if (!(err instanceof HttpErrorResponse) || !errorIsBadRequest(err)) throw err;
        const errorBody: unknown = err.error;
        if (typeof errorBody !== 'object' || errorBody === null || !('error_text' in errorBody)) throw err;
        const errorText = errorBody.error_text;
        if (typeof errorText === 'string' && /No item found with text_id/.test(errorText)) throw new HttpErrorResponse({ status: 403 });
        throw err;
      }),
      decodeSnakeCase(breadcrumbsListDecoder),
      map(l => l.map(e => e.path))
    );
  }
}
