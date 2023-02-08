import { Observable } from 'rxjs';
import { appConfig } from '../../../shared/helpers/config';
import { decodeSnakeCase } from '../../../shared/operators/decode';
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import * as D from 'io-ts/Decoder';

const breadcrumbsFromRootDecoder = D.struct({
  id: D.string,
  languageTag: D.string,
  title: D.string,
  type: D.literal('Chapter','Task','Skill'),
});

export type BreadcrumbsFromRoot = D.TypeOf<typeof breadcrumbsFromRootDecoder>;

@Injectable({
  providedIn: 'root',
})
export class GetBreadcrumbsFromRootsService {
  constructor(private http: HttpClient) {
  }

  get(id: string): Observable<BreadcrumbsFromRoot[][]> {
    return this.http.get<unknown>(`${appConfig.apiUrl}/items/${id}/breadcrumbs-from-roots`).pipe(
      decodeSnakeCase(D.array(D.array(breadcrumbsFromRootDecoder))),
    );
  }
}
