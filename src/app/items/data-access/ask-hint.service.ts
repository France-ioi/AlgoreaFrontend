import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import * as D from 'io-ts/Decoder';
import { ActionResponse, successData } from 'src/app/data-access/action-response';
import { decodeSnakeCase } from 'src/app/utils/operators/decode';
import { APPCONFIG } from 'src/app/app.config';

const askHintDataDecoder = D.struct({
  taskToken: D.string,
});
export type AskHintData = D.TypeOf<typeof askHintDataDecoder>;


@Injectable({
  providedIn: 'root',
})
export class AskHintService {
  private config = inject(APPCONFIG);

  constructor(
    private http: HttpClient,
  ) {}

  ask(taskToken: string, hintRequested: string): Observable<AskHintData> {

    return this.http
      .post<ActionResponse<unknown>>(`${this.config.apiUrl}/items/ask-hint`, {
        task_token: taskToken,
        hint_requested: hintRequested,
      }).pipe(
        map(successData),
        decodeSnakeCase(askHintDataDecoder)
      );
  }

}
