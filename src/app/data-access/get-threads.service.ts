import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { APPCONFIG } from '../app.config';
import { inject } from '@angular/core';
import { decodeSnakeCaseZod } from 'src/app/utils/operators/decode';
import { Observable } from 'rxjs';
import { z } from 'zod';
import { itemTypeSchema } from '../items/models/item-type';
import { userBaseSchema, withId } from '../groups/models/user';

const threadsSchema = z.array(
  z.object({
    item: z.object({
      id: z.string(),
      languageTag: z.string(),
      title: z.string(),
      type: itemTypeSchema,
    }),
    latestUpdateAt: z.coerce.date(),
    messageCount: z.number(),
    participant: withId(userBaseSchema),
    status: z.enum([ 'not_started', 'waiting_for_participant', 'waiting_for_trainer', 'closed' ]),
  }),
);

type Threads = z.infer<typeof threadsSchema>;

@Injectable({
  providedIn: 'root',
})
export class GetThreadsService {
  private config = inject(APPCONFIG);

  constructor(private http: HttpClient) {
  }

  get(itemId: string, options: { isMine: boolean } | { watchedGroupId: string }): Observable<Threads> {
    let params = new HttpParams({ fromObject: { item_id: itemId } });
    if ('isMine' in options) {
      params = params.set('is_mine', options.isMine ? 1 : 0);
    }
    if ('watchedGroupId' in options) {
      params = params.set('watched_group_id', options.watchedGroupId);
    }
    return this.http.get<unknown>(`${this.config.apiUrl}/threads`, {
      params,
    }).pipe(
      decodeSnakeCaseZod(threadsSchema),
    );
  }
}
