import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { APPCONFIG } from '../config';
import { inject } from '@angular/core';
import { z } from 'zod';
import { decodeSnakeCase } from 'src/app/utils/operators/decode';

const searchResponseSchema = z.object({
  searchResults: z.array(
    z.object({
      id: z.string(),
      title: z.string(),
      titleHighlight: z.string().nullable(),
      highlights: z.array(z.string()),
      type: z.enum([ 'Task', 'Chapter' ]),
      score: z.number(),
    })
  ),
});

export type SearchResponse = z.infer<typeof searchResponseSchema>;

@Injectable({
  providedIn: 'root'
})
export class SearchService {
  private http = inject(HttpClient);
  private config = inject(APPCONFIG);

  searchApiUrl: string;

  constructor() {
    if (!this.config.searchApiUrl) throw new Error('To use the search service you must first check that searchApiUrl is set in config!');
    this.searchApiUrl = this.config.searchApiUrl;
  }

  search(query: string): Observable<SearchResponse> {
    const params = new HttpParams({ fromObject: { q: query } });
    return this.http
      .get<unknown>(this.searchApiUrl, { params })
      .pipe(
        decodeSnakeCase(searchResponseSchema),
      );
  }

}
