import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { APPCONFIG } from 'src/app/app.config';
import { inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { assertSuccess, SimpleActionResponse } from 'src/app/data-access/action-response';
import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class RemoveItemPrerequisiteService {
  private config = inject(APPCONFIG);

  constructor(private http: HttpClient) {
  }

  delete(dependentItemId: string, prerequisiteItemId: string): Observable<void> {
    return this.http.delete<SimpleActionResponse>(`${this.config.apiUrl}/items/${dependentItemId}/prerequisites/${prerequisiteItemId}`).pipe(
      map(assertSuccess),
    );
  }
}
