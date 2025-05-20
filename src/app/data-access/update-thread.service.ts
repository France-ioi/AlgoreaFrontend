import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { APPCONFIG } from '../app.config';
import { inject } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { assertSuccess, SimpleActionResponse } from 'src/app/data-access/action-response';

export interface OpenThread {
  status: 'waiting_for_trainer',
  helperGroupId: string,
  messageCountIncrement?: number,
}

interface CloseThread {
  status: 'closed',
}

export interface IncrementMessageCount {
  messageCountIncrement: number,
}

@Injectable({
  providedIn: 'root',
})
export class UpdateThreadService {
  private config = inject(APPCONFIG);

  constructor(private http: HttpClient) {}

  update(itemId: string, participantId: string, payload: OpenThread | CloseThread | IncrementMessageCount): Observable<void> {
    return this.http.put<SimpleActionResponse>(
      `${this.config.apiUrl}/items/${itemId}/participant/${participantId}/thread`,
      'status' in payload && payload.status === 'closed' ? {
        status: payload.status,
      } : 'status' in payload && payload.status === 'waiting_for_trainer' ? {
        status: payload.status,
        helper_group_id: payload.helperGroupId,
        ...(payload.messageCountIncrement ? { message_count_increment: payload.messageCountIncrement } : {}),
      } : {
        message_count_increment: payload.messageCountIncrement,
      }).pipe(map(assertSuccess));
  }
}
