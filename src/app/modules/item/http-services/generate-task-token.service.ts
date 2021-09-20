import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import * as D from 'io-ts/Decoder';
import { appConfig } from 'src/app/shared/helpers/config';
import { decodeSnakeCase } from 'src/app/shared/operators/decode';

export const taskTokenResponseDecoder = D.struct({
  data: D.struct({
    taskToken: D.string,
  }),
  message: D.string,
  success: D.boolean,
});

type TaskTokenResponse = D.TypeOf<typeof taskTokenResponseDecoder>;
export type TaskToken = TaskTokenResponse['data']['taskToken'];

@Injectable({
  providedIn: 'root',
})
export class GenerateTaskTokenService {

  constructor(private http: HttpClient) {}

  generate(itemId: string, attemptId: string, asTeamId?: string): Observable<TaskToken> {
    const params = asTeamId ? new HttpParams({ fromObject: { as_team_id: asTeamId } }) : undefined;
    return this.http.post<unknown>(
      `${appConfig.apiUrl}/items/${itemId}/attempts/${attemptId}/generate-task-token`,
      undefined,
      { params },
    ).pipe(
      decodeSnakeCase(taskTokenResponseDecoder),
      map(({ data }) => data.taskToken),
    );
  }

}
