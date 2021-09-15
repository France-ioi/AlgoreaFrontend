import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { appConfig } from 'src/app/shared/helpers/config';
import * as D from 'io-ts/Decoder';
import { decodeSnakeCase } from 'src/app/shared/operators/decode';

export const responseDecoder = D.struct({
  message: D.string,
  success: D.boolean,
});

export type CreateCurrentAnswerResponse = D.TypeOf<typeof responseDecoder>;

interface CreateCurrentAnswerBody {
  answer: string,
  state: string,
}

@Injectable({
  providedIn: 'root',
})
export class CreateCurrentAnswerService {

  constructor(private http: HttpClient) {}

  create(itemId: string, attemptId: string, body: CreateCurrentAnswerBody, asTeamId?: string): Observable<CreateCurrentAnswerResponse> {
    const params = new HttpParams({
      fromObject: asTeamId ? { attempt_id: attemptId, as_team_id: asTeamId } : { attempt_id: attemptId },
    });
    return this.http
      .post<unknown>(`${appConfig.apiUrl}/items/${itemId}/attempts/${attemptId}/answers`, body, { params })
      .pipe(decodeSnakeCase(responseDecoder));
  }

}
