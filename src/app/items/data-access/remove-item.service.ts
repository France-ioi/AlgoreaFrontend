import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { assertSuccess, SimpleActionResponse } from 'src/app/data-access/action-response';
import { APPCONFIG } from 'src/app/config';
import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class RemoveItemService {
  private http = inject(HttpClient);
  private config = inject(APPCONFIG);

  delete(itemId: string): Observable<void> {
    return this.http.delete<SimpleActionResponse>(`${this.config.apiUrl}/items/${itemId}`).pipe(
      map(assertSuccess),
    );
  }
}
