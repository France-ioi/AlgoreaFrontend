import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { appConfig } from '../../../shared/helpers/config';
import { decodeSnakeCase } from '../../../shared/operators/decode';
import * as D from 'io-ts/Decoder';
import { dateDecoder } from 'src/app/shared/helpers/decoders';
import { itemCorePermDecoder } from 'src/app/shared/models/domain/item-permissions';
import { pipe } from 'fp-ts/function';

const participantProgressDecoder = pipe(
  D.struct({
    item: D.struct({
      hintsRequested: D.number,
      itemId: D.string,
      latestActivityAt: D.nullable(dateDecoder),
      score: D.number,
      submissions: D.number,
      timeSpent: D.number,
      validated: D.boolean,
    })
  }),
  D.intersect(
    D.partial({
      children: D.array(D.struct({
        currentUserPermissions: itemCorePermDecoder,
        hintsRequested: D.number,
        itemId: D.string,
        latestActivityAt: D.nullable(dateDecoder),
        noScore: D.boolean,
        score: D.number,
        string: D.struct({
          languageTag: D.string,
          title: D.nullable(D.string),
        }),
        submissions: D.number,
        timeSpent: D.number,
        type: D.literal('Chapter', 'Task', 'Skill'),
        validated: D.boolean,
      })),
    })
  ),
);

export type ParticipantProgress = D.TypeOf<typeof participantProgressDecoder>;

@Injectable({
  providedIn: 'root'
})
export class GetParticipantProgressService {

  constructor(private http: HttpClient) { }

  get(id: string): Observable<ParticipantProgress> {
    return this.http
      .get<unknown[]>(`${appConfig.apiUrl}/items/${id}/participant-progress`)
      .pipe(
        decodeSnakeCase(participantProgressDecoder)
      );
  }
}
