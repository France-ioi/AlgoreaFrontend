import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { appConfig } from '../helpers/config';
import * as D from 'io-ts/Decoder';
import { decodeSnakeCase } from 'src/app/shared/operators/decode';

const searchResponseDecoder = D.struct({
  searchResults: D.array(
    D.struct({
      id: D.string,
      title: D.string,
      type: D.literal('Task', 'Chapter'),
      score: D.number,
    }),
  ),
});

export type SearchResponse = D.TypeOf<typeof searchResponseDecoder>;

@Injectable({
  providedIn: 'root'
})
export class SearchService {

  searchApiUrl: string;

  constructor(private http: HttpClient) {
    if (!appConfig.searchApiUrl) throw new Error('To use the search service you must first check that searchApiUrl is set in config!');
    this.searchApiUrl = appConfig.searchApiUrl;
  }

  search(query: string): Observable<SearchResponse> {
    const params = new HttpParams({ fromObject: { q: query } });
    return this.http
      .get<unknown>(this.searchApiUrl, { params })
      .pipe(
        decodeSnakeCase(searchResponseDecoder),
      );
  }

}
