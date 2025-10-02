import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { APPCONFIG } from '../config';
import { inject } from '@angular/core';
import { ThreadId } from '../forum/models/threads';
import { z } from 'zod';
import { decodeSnakeCase } from '../utils/operators/decode';

const messageSchema = z.object({
  time: z.date(),
  createdBy: z.string(),
  message: z.string(),
});
export type ThreadMessage = z.infer<typeof messageSchema>;

@Injectable({
  providedIn: 'root'
})
export class ThreadMessageService {
  private config = inject(APPCONFIG);

  constructor(private http: HttpClient) {}

  getAll(options: { authToken: string, limit?: number, from?: Date }): Observable<ThreadMessage[]> {
    // thread id is deduce from the token
    let params = new HttpParams();
    if (options?.limit) params = params.set('limit', options.limit);
    if (options?.from) params = params.set('from', options.from.valueOf());

    // eslint-disable-next-line @typescript-eslint/naming-convention
    const headers = { Authorization: `Bearer ${options.authToken}` };

    return this.http.get<unknown>(`${this.config.slsApiUrl}/forum/message`, { params, headers }).pipe(
      decodeSnakeCase(z.array(messageSchema)),
    );
  }
}
