import { HttpClient, HttpParams, HttpResponse } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { APPCONFIG } from '../config';

@Injectable({
  providedIn: 'root'
})
export class ProgressZipService {
  private http = inject(HttpClient);
  private config = inject(APPCONFIG);

  getZipData(groupId: string, parentItemIds: string[]): Observable<HttpResponse<Blob>> {
    const params = new HttpParams().set('parent_item_ids', parentItemIds.join(','));
    return this.http.get(`${this.config.apiUrl}/groups/${ groupId }/group-progress-with-answers-zip`, {
      params,
      responseType: 'blob',
      observe: 'response',
    });
  }
}
