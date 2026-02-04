import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, of, switchMap } from 'rxjs';
import { APPCONFIG } from '../config';
import { inject } from '@angular/core';
import { decodeSnakeCase } from 'src/app/utils/operators/decode';
import jwtDecode from 'jwt-decode';
import { Thread, threadSchema, threadTokenSchema } from '../forum/models/threads';

@Injectable({
  providedIn: 'root',
})
export class ThreadService {
  private http = inject(HttpClient);
  private config = inject(APPCONFIG);

  get(itemId: string, participantId: string): Observable<Thread> {
    return this.http.get<unknown>(`${this.config.apiUrl}/items/${itemId}/participant/${participantId}/thread`).pipe(
      decodeSnakeCase(threadSchema),
      switchMap(thread => of(jwtDecode(thread.token, { header: false })).pipe(
        decodeSnakeCase(threadTokenSchema),
        map(token => ({ ...thread, ...token }))
      ))
    );
  }

}
