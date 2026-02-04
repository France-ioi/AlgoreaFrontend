import { HttpClient, HttpParams } from '@angular/common/http';
import { APPCONFIG } from '../config';
import { inject } from '@angular/core';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { decodeSnakeCase } from '../utils/operators/decode';
import { z } from 'zod';

@Injectable({
  providedIn: 'root'
})
export class ProgressCSVService {
  private http = inject(HttpClient);
  private config = inject(APPCONFIG);

  getCSVData(groupId: string, type: 'group' | 'team' | 'user', parentItemIds: string[]): Observable<string> {
    const params = new HttpParams().set('parent_item_ids', parentItemIds.join(','));
    return this.http
      .get(`${this.config.apiUrl}/groups/${ groupId }/${ type }-progress-csv`, {
        params: params,
        responseType: 'text',
      }).pipe(
        decodeSnakeCase(z.string()),
      );
  }
}
