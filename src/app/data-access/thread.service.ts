import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, of, switchMap } from 'rxjs';
import { APPCONFIG } from '../app.config';
import { inject } from '@angular/core';
import { decodeSnakeCaseZod } from 'src/app/utils/operators/decode';
import jwtDecode from 'jwt-decode';
import { Thread, threadSchema, threadTokenSchema } from '../forum/models/threads';

@Injectable({
  providedIn: 'root',
})
export class ThreadService {
  private config = inject(APPCONFIG);

  constructor(private http: HttpClient) {}

  get(itemId: string, participantId: string): Observable<Thread> {
    return this.http.get<unknown>(`${this.config.apiUrl}/items/${itemId}/participant/${participantId}/thread`).pipe(
      decodeSnakeCaseZod(threadSchema),
      switchMap(thread => of(jwtDecode(thread.token, { header: false })).pipe(
        decodeSnakeCaseZod(threadTokenSchema),
        map(token => ({ ...thread, ...token }))
      ))
    );
  }

}
