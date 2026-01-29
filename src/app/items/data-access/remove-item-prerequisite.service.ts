import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { APPCONFIG } from 'src/app/config';
import { inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { assertSuccess, SimpleActionResponse } from 'src/app/data-access/action-response';
import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class RemoveItemPrerequisiteService {
  private http = inject(HttpClient);
  private config = inject(APPCONFIG);

  delete(dependentItemId: string, prerequisiteItemId: string): Observable<void> {
    const url = `${this.config.apiUrl}/items/${dependentItemId}/prerequisites/${prerequisiteItemId}`;
    return this.http.delete<SimpleActionResponse>(url).pipe(
      map(assertSuccess),
    );
  }
}
