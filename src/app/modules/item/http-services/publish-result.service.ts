import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { appConfig } from 'src/app/shared/helpers/config';
import { ActionResponse, successData } from 'src/app/shared/http-services/action-response';

@Injectable({
  providedIn: 'root',
})
export class PublishResultsService {

  constructor(private http: HttpClient) {}

  publish(itemId: string, attemptId: string): Observable<void> {
    return this.http
      .post<ActionResponse<never>>(`${appConfig.apiUrl}/items/${itemId}/attempts/${attemptId}/publish`, {})
      .pipe(map(successData));
  }

}
