import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { APPCONFIG } from '../config';
import { inject } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { assertSuccess, SimpleActionResponse } from 'src/app/data-access/action-response';

type ThreadOpenStatus = 'waiting_for_participant' | 'waiting_for_trainer';

type UpdateThreadPayload =
  | { status: ThreadOpenStatus, helperGroupId: string, messageCountIncrement?: number }
  | { status: 'closed' }
  | { messageCountIncrement: number };

@Injectable({
  providedIn: 'root',
})
export class UpdateThreadService {
  private http = inject(HttpClient);
  private config = inject(APPCONFIG);

  update(itemId: string, participantId: string, payload: UpdateThreadPayload): Observable<void> {
    return this.http.put<SimpleActionResponse>(
      `${this.config.apiUrl}/items/${itemId}/participant/${participantId}/thread`,
      this.toApiBody(payload),
    ).pipe(map(assertSuccess));
  }

  private toApiBody(payload: UpdateThreadPayload): Record<string, unknown> {
    if (!('status' in payload)) {
      return { message_count_increment: payload.messageCountIncrement };
    }
    if (payload.status === 'closed') {
      return { status: payload.status };
    }
    return {
      status: payload.status,
      helper_group_id: payload.helperGroupId,
      ...(payload.messageCountIncrement ? { message_count_increment: payload.messageCountIncrement } : {}),
    };
  }
}
