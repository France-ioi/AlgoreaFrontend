import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, switchMap, Observable } from 'rxjs';
import { z } from 'zod';
import { APPCONFIG } from '../config';
import { IdentityTokenService } from '../services/auth/identity-token.service';
import { decodeSnakeCase } from '../utils/operators/decode';
import { assertSuccess, SimpleActionResponse } from './action-response';

const followStatusResponseSchema = z.object({
  isFollowing: z.boolean(),
});

@Injectable({
  providedIn: 'root'
})
export class ThreadFollowService {
  private config = inject(APPCONFIG);
  private http = inject(HttpClient);
  private identityTokenService = inject(IdentityTokenService);

  getFollowStatus(itemId: string, participantId: string): Observable<boolean> {
    if (!this.config.slsApiUrl) {
      throw new Error('slsApiUrl is not configured');
    }
    return this.identityTokenService.identityToken$.pipe(
      switchMap(token => this.http.get<unknown>(
        `${this.config.slsApiUrl}/forum/thread/${itemId}/${participantId}/follows`,
        // eslint-disable-next-line @typescript-eslint/naming-convention
        { headers: { Authorization: `Bearer ${token}` } }
      )),
      decodeSnakeCase(followStatusResponseSchema),
      map(response => response.isFollowing),
    );
  }

  follow(itemId: string, participantId: string, options: { authToken: string }): Observable<void> {
    if (!this.config.slsApiUrl) {
      throw new Error('slsApiUrl is not configured');
    }
    // eslint-disable-next-line @typescript-eslint/naming-convention
    const headers = { Authorization: `Bearer ${options.authToken}` };
    return this.http.post<SimpleActionResponse>(
      `${this.config.slsApiUrl}/forum/thread/${itemId}/${participantId}/follows`,
      {},
      { headers }
    ).pipe(
      map(assertSuccess),
    );
  }

  unfollow(itemId: string, participantId: string): Observable<void> {
    if (!this.config.slsApiUrl) {
      throw new Error('slsApiUrl is not configured');
    }
    return this.identityTokenService.identityToken$.pipe(
      switchMap(token => this.http.delete<SimpleActionResponse>(
        `${this.config.slsApiUrl}/forum/thread/${itemId}/${participantId}/follows`,
        // eslint-disable-next-line @typescript-eslint/naming-convention
        { headers: { Authorization: `Bearer ${token}` } }
      )),
      map(assertSuccess),
    );
  }
}
