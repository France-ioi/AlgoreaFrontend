import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import decodeJWT from 'jwt-decode';
import * as D from 'io-ts/Decoder';
import { ActionResponse, successData } from 'src/app/shared/http-services/action-response';
import { decodeSnakeCase } from 'src/app/shared/operators/decode';
import { appConfig } from 'src/app/shared/helpers/config';
import { decode } from 'src/app/shared/helpers/decoders';
import { pipe } from 'fp-ts/function';

const askHintDataDecoder = D.struct({
  taskToken: D.string,
});
export type AskHintData = D.TypeOf<typeof askHintDataDecoder>;

const hintTokenDecoder = pipe(
  D.struct({
    idUser: D.string,
    itemUrl: D.string,
    askedHint: D.union(D.UnknownRecord, D.UnknownArray, D.number, D.string),
  }),
  D.intersect(D.UnknownRecord),
);

@Injectable({
  providedIn: 'root',
})
export class AskHintService {

  constructor(
    private http: HttpClient,
  ) {}

  ask(itemId: string, attemptId: string, taskToken: string, hintRequested: string): Observable<AskHintData> {
    const data = decode(hintTokenDecoder)(decodeJWT(hintRequested));

    return this.http
      .post<ActionResponse<unknown>>(`${appConfig.apiUrl}/items/ask-hint`, {
        task_token: taskToken,
        hint_requested: {
          ...data,
          idItemLocal: itemId,
          idAttempt: `${data.idUser}/${attemptId}`,
        },
      }).pipe(
        map(successData),
        decodeSnakeCase(askHintDataDecoder)
      );
  }

}
