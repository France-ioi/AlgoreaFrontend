import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, of, switchMap } from 'rxjs';
import { APPCONFIG } from '../app.config';
import { inject } from '@angular/core';
import { z } from 'zod';
import { decodeSnakeCaseZod } from 'src/app/utils/operators/decode';
import jwtDecode from 'jwt-decode';

const threadSchema = z.object({
  itemId: z.string(),
  participantId: z.string(),
  status: z.enum([ 'not_started', 'waiting_for_participant', 'waiting_for_trainer', 'closed' ]),
  token: z.string(),
});

type Thread = z.infer<typeof threadSchema>;

const threadTokenSchema = z.object({
  itemId: z.string(),
  participantId: z.string(),
  userId: z.string(),
  isMine: z.boolean(),
  canWatch: z.boolean(),
  canWrite: z.boolean(),
});
type ThreadToken = z.infer<typeof threadTokenSchema>;

export type ThreadInfo = Thread & ThreadToken;

@Injectable({
  providedIn: 'root',
})
export class ThreadService {
  private config = inject(APPCONFIG);

  constructor(private http: HttpClient) {}

  get(itemId: string, participantId: string): Observable<ThreadInfo> {
    return this.http.get<unknown>(`${this.config.apiUrl}/items/${itemId}/participant/${participantId}/thread`).pipe(
      decodeSnakeCaseZod(threadSchema),
      switchMap(thread => of(jwtDecode(thread.token, { header: false })).pipe(
        decodeSnakeCaseZod(threadTokenSchema),
        map(token => ({ ...thread, ...token }))
      ))
    );
  }

}
