import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { assertSuccess, SimpleActionResponse } from 'src/app/data-access/action-response';
import { map } from 'rxjs/operators';
import { Observable } from 'rxjs';
import { APPCONFIG } from 'src/app/config';

@Injectable({
  providedIn: 'root'
})
export class DeleteItemStringService {
  private http = inject(HttpClient);
  private config = inject(APPCONFIG);

  delete(
    itemId: string,
    languageTag: string
  ) : Observable<void> {
    return this.http.delete<SimpleActionResponse>(`${this.config.apiUrl}/items/${itemId}/strings/${languageTag}`).pipe(map(assertSuccess));
  }
}
