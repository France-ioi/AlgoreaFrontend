import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { appConfig } from 'src/app/utils/config';
import { HttpClient } from '@angular/common/http';
import { assertSuccess, SimpleActionResponse } from 'src/app/data-access/action-response';
import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class RemoveItemPrerequisiteService {

  constructor(private http: HttpClient) {
  }

  delete(dependentItemId: string, prerequisiteItemId: string): Observable<void> {
    return this.http.delete<SimpleActionResponse>(`${appConfig.apiUrl}/items/${dependentItemId}/prerequisites/${prerequisiteItemId}`).pipe(
      map(assertSuccess),
    );
  }
}
