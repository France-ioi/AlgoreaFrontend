import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, switchMap, Observable } from 'rxjs';
import { z } from 'zod';
import { APPCONFIG } from '../config';
import { IdentityTokenService } from '../services/auth/identity-token.service';
import { decodeSnakeCase } from '../utils/operators/decode';

const notificationSchema = z.object({
  sk: z.number(),
  notificationType: z.string(),
  payload: z.record(z.string(), z.unknown()),
  readTime: z.number().optional(),
});

const notificationsResponseSchema = z.object({
  notifications: z.array(notificationSchema),
});

export type Notification = z.infer<typeof notificationSchema>;
export type NotificationsResponse = z.infer<typeof notificationsResponseSchema>;

@Injectable({
  providedIn: 'root'
})
export class NotificationHttpService {
  private config = inject(APPCONFIG);
  private http = inject(HttpClient);
  private identityTokenService = inject(IdentityTokenService);

  getNotifications(): Observable<Notification[]> {
    if (!this.config.slsApiUrl) {
      throw new Error('slsApiUrl is not configured');
    }
    return this.identityTokenService.identityToken$.pipe(
      switchMap(token => this.http.get<unknown>(
        `${this.config.slsApiUrl}/notifications`,
        // eslint-disable-next-line @typescript-eslint/naming-convention
        { headers: { Authorization: `Bearer ${token}` } }
      )),
      decodeSnakeCase(notificationsResponseSchema),
      map(response => response.notifications),
    );
  }
}
