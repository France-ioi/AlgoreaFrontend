import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { APPCONFIG } from 'src/app/config';

function authHeaders(taskToken: string): Record<string, string> {
  // eslint-disable-next-line @typescript-eslint/naming-convention
  return { Authorization: `Bearer ${taskToken}` };
}

@Injectable({
  providedIn: 'root',
})
export class TaskSessionHttpService {
  private config = inject(APPCONFIG);
  private http = inject(HttpClient);

  start(taskToken: string, attemptId: string, resultStartedAt?: Date): Observable<void> {
    if (!this.config.slsApiUrl) return of(undefined);

    const params: Record<string, string> = { attempt_id: attemptId };
    if (resultStartedAt) {
      params['result_started_at'] = resultStartedAt.toISOString();
    }

    return this.http.post<void>(
      `${this.config.slsApiUrl}/task-session/start`,
      null,
      { params, headers: authHeaders(taskToken) },
    );
  }

  continue(taskToken: string, attemptId: string): Observable<void> {
    if (!this.config.slsApiUrl) return of(undefined);

    return this.http.post<void>(
      `${this.config.slsApiUrl}/task-session/continue`,
      null,
      { params: { attempt_id: attemptId }, headers: authHeaders(taskToken) },
    );
  }

  stop(taskToken: string): Observable<void> {
    if (!this.config.slsApiUrl) return of(undefined);

    return this.http.post<void>(
      `${this.config.slsApiUrl}/task-session/stop`,
      null,
      { headers: authHeaders(taskToken) },
    );
  }

  /**
   * Uses fetch with keepalive for reliability during page unload / visibility hidden.
   * sendBeacon cannot be used because it does not support custom headers.
   */
  stopViaFetch(taskToken: string): void {
    if (!this.config.slsApiUrl) return;

    fetch(`${this.config.slsApiUrl}/task-session/stop`, {
      method: 'POST',
      keepalive: true,
      headers: authHeaders(taskToken),
    }).catch(() => {});
  }
}
