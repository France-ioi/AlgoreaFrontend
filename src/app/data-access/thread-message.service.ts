import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { APPCONFIG } from '../config';
import { inject } from '@angular/core';
import { z } from 'zod';
import { decodeSnakeCase } from '../utils/operators/decode';
import { assertSuccess, SimpleActionResponse } from './action-response';
import { ItemId, ParticipantId } from '../models/ids';

const messageSchema = z.object({
  time: z.number().transform(val => new Date(val)),
  authorId: z.string(),
  text: z.string(),
  uuid: z.string(),
});
export type ThreadMessage = z.infer<typeof messageSchema>;

@Injectable({
  providedIn: 'root'
})
export class ThreadMessageService {
  private http = inject(HttpClient);
  private config = inject(APPCONFIG);

  create(
    itemId: ItemId,
    participantId: ParticipantId,
    message: { text: string, uuid: string },
    options: { authToken: string },
  ): Observable<void> {

    // eslint-disable-next-line @typescript-eslint/naming-convention
    const headers = { Authorization: `Bearer ${options.authToken}` };

    return this.http
      .post<SimpleActionResponse>(`${this.config.slsApiUrl}/forum/thread/${itemId}/${participantId}/messages`, message, { headers })
      .pipe(
        map(assertSuccess),
      );
  }

  getAll(
    itemId: ItemId,
    participantId: ParticipantId,
    options: { authToken: string, limit?: number, from?: Date },
  ): Observable<ThreadMessage[]> {
    let params = new HttpParams();
    if (options?.limit) params = params.set('limit', options.limit);
    if (options?.from) params = params.set('from', options.from.valueOf());

    // eslint-disable-next-line @typescript-eslint/naming-convention
    const headers = { Authorization: `Bearer ${options.authToken}` };

    return this.http.get<unknown>(`${this.config.slsApiUrl}/forum/thread/${itemId}/${participantId}/messages`, { params, headers }).pipe(
      decodeSnakeCase(z.array(messageSchema)),
    );
  }
}
