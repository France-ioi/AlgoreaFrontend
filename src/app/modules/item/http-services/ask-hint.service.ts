import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import * as D from 'io-ts/Decoder';
import { ActionResponse, successData } from 'src/app/shared/http-services/action-response';
import { decodeSnakeCase } from 'src/app/shared/operators/decode';
import { appConfig } from 'src/app/shared/helpers/config';

const askHintDataDecoder = D.struct({
  taskToken: D.string,
});
export type AskHintData = D.TypeOf<typeof askHintDataDecoder>;


@Injectable({
  providedIn: 'root',
})
export class AskHintService {

  constructor(
    private http: HttpClient,
  ) {}

  ask(taskToken: string, hintRequested: string): Observable<AskHintData> {

    return this.http
      .post<ActionResponse<unknown>>(`${appConfig.apiUrl}/items/ask-hint`, {
        task_token: taskToken,
        hint_requested: hintRequested,
      }).pipe(
        map(successData),
        decodeSnakeCase(askHintDataDecoder)
      );
  }

}
