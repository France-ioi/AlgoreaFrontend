import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { appConfig } from '../../../shared/helpers/config';
import { HttpClient } from '@angular/common/http';
import * as D from 'io-ts/Decoder';
import { decodeSnakeCase } from '../../../shared/operators/decode';
import { itemCorePermDecoder } from 'src/app/shared/models/domain/item-permissions';
import { pipe } from 'fp-ts/function';
import { durationDecoder } from '../../../shared/helpers/decoders';

const itemPrerequisitesDecoder = pipe(
  D.struct({
    allowsMultipleAttempts: D.boolean,
    bestScore: D.number,
    defaultLanguageTag: D.string,
    dependencyGrantContentView: D.boolean,
    dependencyRequiredScore: D.number,
    displayDetailsInParent: D.boolean,
    duration: D.nullable(durationDecoder),
    entryParticipantType: D.literal('User', 'Team'),
    id: D.string,
    noScore: D.boolean,
    permissions: itemCorePermDecoder,
    requiresExplicitEntry: D.boolean,
    string: pipe(
      D.struct({
        languageTag: D.string,
        title: D.nullable(D.string),
      }),
      D.intersect(
        D.partial({
          subtitle: D.nullable(D.string),
        }),
      ),
    ),
    type: D.literal('Chapter', 'Task', 'Course', 'Skill'),
    validationType: D.literal('None','All','AllButOne','Categories','One','Manual'),
  }),
  D.intersect(
    D.partial({
      watchedGroup: pipe(
        D.struct({
          canView: D.literal('none','info','content','content_with_descendants','solution'),
        }),
        D.intersect(
          D.partial({
            allValidated: D.boolean,
            avgScore: D.number,
          }),
        ),
      ),
    }),
  ),
);

export type ItemPrerequisite = D.TypeOf<typeof itemPrerequisitesDecoder>;

@Injectable({
  providedIn: 'root',
})
export class GetItemPrerequisitesService {

  constructor(private http: HttpClient) {}

  get(itemId: string): Observable<ItemPrerequisite[]> {
    return this.http
      .get<unknown[]>(`${appConfig.apiUrl}/items/${ itemId }/prerequisites`)
      .pipe(
        decodeSnakeCase(D.array(itemPrerequisitesDecoder))
      );
  }
}
