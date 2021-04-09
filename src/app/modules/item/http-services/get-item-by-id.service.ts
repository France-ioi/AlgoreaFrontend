import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { appConfig } from 'src/app/shared/helpers/config';
import * as D from 'io-ts/Decoder';
import { pipe } from 'fp-ts/lib/function';
import { decodeSnakeCase } from 'src/app/shared/operators/decode';

export const itemDecoder = pipe(
  D.struct({
    id: D.string,
    requiresExplicitEntry: D.boolean,
    string: pipe(
      D.struct({
        title: D.nullable(D.string),
      }),
      D.intersect(
        D.partial({
          subtitle: D.nullable(D.string),
          description: D.nullable(D.string),
        })
      )
    ),
    bestScore: D.number,
    permissions: D.struct({
      canView: D.literal('none','info','content','content_with_descendants','solution'),
      canEdit: D.literal('none','children','all','all_with_grant'),
      canGrantView: D.literal('none','enter','content','content_with_descendants','solution','solution_with_grant'),
    }),
    type: D.literal('Chapter','Task','Course','Skill'),
    promptToJoinGroupByCode: D.boolean,
    textId: D.nullable(D.string),
    validationType: D.literal('None','All','AllButOne','Categories','One','Manual'),
    noScore: D.boolean,
    titleBarVisible: D.boolean,
    fullScreen: D.literal('forceYes','forceNo','default'),
  }),
  D.intersect(
    D.partial({
      url: D.nullable(D.string),
      usesApi: D.nullable(D.boolean),
    })
  )
);

export type Item = D.TypeOf<typeof itemDecoder>;

@Injectable({
  providedIn: 'root',
})
export class GetItemByIdService {

  constructor(private http: HttpClient) {}

  get(id: string): Observable<Item> {
    return this.http.get<unknown>(`${appConfig().apiUrl}/items/${id}`).pipe(
      decodeSnakeCase(itemDecoder),
    );
  }

}
