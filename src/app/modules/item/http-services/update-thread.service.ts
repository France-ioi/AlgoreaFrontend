import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { appConfig } from '../../../shared/helpers/config';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { assertSuccess, SimpleActionResponse } from '../../../shared/http-services/action-response';

export interface OpenThread {
  status: 'waiting_for_trainer',
  helperGroupId: string,
}

interface CloseThread {
  status: 'closed',
}

@Injectable({
  providedIn: 'root',
})
export class UpdateThreadService {
  constructor(private http: HttpClient) {}

  update(itemId: string, participantId: string, payload: OpenThread | CloseThread): Observable<void> {
    return this.http.put<SimpleActionResponse>(`${appConfig.apiUrl}/items/${itemId}/participant/${participantId}/thread`, {
      status: payload.status,
      ...('helperGroupId' in payload ? { helper_group_id: payload.helperGroupId } : {}),
    }).pipe(
      map(assertSuccess),
    );
  }
}
