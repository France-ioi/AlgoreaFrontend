import { HttpClient, HttpParams } from '@angular/common/http';
import { appConfig } from '../helpers/config';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ProgressCSVService {
  constructor(private http: HttpClient) {}

  getCSVData(groupId: string, type: 'group' | 'team' | 'user', parentItemIds: string[]): Observable<string> {
    const params = new HttpParams().set('parent_item_ids', parentItemIds.join(','));
    return this.http
      .get(`${appConfig.apiUrl}/groups/${ groupId }/${ type }-progress-csv`, {
        params: params,
        responseType: 'text',
      });
  }
}
