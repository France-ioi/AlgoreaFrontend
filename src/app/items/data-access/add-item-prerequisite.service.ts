import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { APPCONFIG } from 'src/app/app.config';
import { HttpClient } from '@angular/common/http';
import { assertSuccess, SimpleActionResponse } from 'src/app/data-access/action-response';
import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class AddItemPrerequisiteService {
  private config = inject(APPCONFIG);

  constructor(private http: HttpClient) {}

  create(dependentItemId: string, prerequisiteItemId: string): Observable<void> {
    return this.http
      .post<SimpleActionResponse>(`${this.config.apiUrl}/items/${ dependentItemId }/prerequisites/${ prerequisiteItemId }`, {
        grant_content_view: true,
      })
      .pipe(map(assertSuccess));
  }
}
