import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import * as D from 'io-ts/Decoder';
import { appConfig } from 'src/app/shared/helpers/config';
import { decodeSnakeCase } from 'src/app/shared/operators/decode';
import { ActionResponse, successData } from 'src/app/shared/http-services/action-response';

const taskTokenDataDecoder = D.struct({
  taskToken: D.string,
});

type TaskTokenData = D.TypeOf<typeof taskTokenDataDecoder>;
export type TaskToken = TaskTokenData['taskToken'];

@Injectable({
  providedIn: 'root',
})
export class TaskTokenService {

  constructor(private http: HttpClient) {}

  generate(itemId: string, attemptId: string, asTeamId?: string): Observable<TaskToken> {
    const params = asTeamId ? new HttpParams({ fromObject: { as_team_id: asTeamId } }) : undefined;
    return this.http.post<ActionResponse<unknown>>(
      `${appConfig.apiUrl}/items/${itemId}/attempts/${attemptId}/generate-task-token`,
      undefined,
      { params },
    ).pipe(
      map(successData),
      decodeSnakeCase(taskTokenDataDecoder),
      map(data => data.taskToken),
    );
  }

}
