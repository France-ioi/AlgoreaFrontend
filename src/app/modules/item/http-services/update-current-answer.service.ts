import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { appConfig } from 'src/app/shared/helpers/config';
import { successData, ActionResponse } from 'src/app/shared/http-services/action-response';
import { map, mapTo } from 'rxjs/operators';

interface UpdateCurrentAnswerBody {
  answer: string,
  state: string,
}

@Injectable({
  providedIn: 'root',
})
export class UpdateCurrentAnswerService {

  constructor(private http: HttpClient) {}

  update(itemId: string, attemptId: string, body: UpdateCurrentAnswerBody, asTeamId?: string): Observable<void> {
    const params = new HttpParams({
      fromObject: asTeamId ? { attempt_id: attemptId, as_team_id: asTeamId } : { attempt_id: attemptId },
    });
    return this.http
      .put<ActionResponse<unknown>>(`${appConfig.apiUrl}/items/${itemId}/attempts/${attemptId}/answers/current`, body, { params })
      .pipe(map(successData), mapTo(undefined));
  }

}
