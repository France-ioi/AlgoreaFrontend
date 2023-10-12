import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { assertSuccess, SimpleActionResponse } from 'src/app/data-access/action-response';
import { appConfig } from 'src/app/utils/config';
import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class RemoveItemService {

  constructor(private http: HttpClient) {
  }

  delete(itemId: string): Observable<void> {
    return this.http.delete<SimpleActionResponse>(`${appConfig.apiUrl}/items/${itemId}`).pipe(
      map(assertSuccess),
    );
  }
}
