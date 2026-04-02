import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { switchMap, take } from 'rxjs/operators';
import { z } from 'zod';
import { APPCONFIG } from '../../config';
import { decodeSnakeCase } from '../../utils/operators/decode';
import { IdentityTokenService } from '../../services/auth/identity-token.service';

const communityStatsSchema = z.object({
  validations: z.object({
    last24h: z.number(),
    last30d: z.number(),
    last1y: z.number(),
  }),
  activeUsers: z.object({
    last24h: z.number(),
    last30d: z.number(),
    last1y: z.number(),
  }),
  connectedUsers: z.number(),
});

export type CommunityStats = z.infer<typeof communityStatsSchema>;

@Injectable({
  providedIn: 'root',
})
export class GetCommunityStatsService {
  private http = inject(HttpClient);
  private config = inject(APPCONFIG);
  private identityTokenService = inject(IdentityTokenService);

  get(): Observable<CommunityStats> {
    const slsApiUrl = this.config.slsApiUrl;
    if (!slsApiUrl) {
      const zeroCounts = { last24h: 0, last30d: 0, last1y: 0 };
      return of({ validations: zeroCounts, activeUsers: zeroCounts, connectedUsers: 0 });
    }

    return this.identityTokenService.identityToken$.pipe(
      take(1),
      switchMap(token => this.http.get<unknown>(`${slsApiUrl}/stats`, {
        headers: { authorization: `Bearer ${token}` },
      })),
      decodeSnakeCase(communityStatsSchema),
    );
  }
}
