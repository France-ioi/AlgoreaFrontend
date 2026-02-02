import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, switchMap, Observable } from 'rxjs';
import { z } from 'zod';
import { APPCONFIG } from '../config';
import { IdentityTokenService } from '../services/auth/identity-token.service';
import { decodeSnakeCase } from '../utils/operators/decode';
import { Notification, notificationSchema } from '../models/notification';

const notificationsResponseSchema = z.object({
  notifications: z.array(notificationSchema),
});

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

  deleteNotification(sk: number): Observable<void> {
    if (!this.config.slsApiUrl) {
      throw new Error('slsApiUrl is not configured');
    }
    return this.identityTokenService.identityToken$.pipe(
      switchMap(token => this.http.delete<void>(
        `${this.config.slsApiUrl}/notifications/${sk}`,
        // eslint-disable-next-line @typescript-eslint/naming-convention
        { headers: { Authorization: `Bearer ${token}` } }
      )),
    );
  }

  deleteAllNotifications(): Observable<void> {
    if (!this.config.slsApiUrl) {
      throw new Error('slsApiUrl is not configured');
    }
    return this.identityTokenService.identityToken$.pipe(
      switchMap(token => this.http.delete<void>(
        `${this.config.slsApiUrl}/notifications/all`,
        // eslint-disable-next-line @typescript-eslint/naming-convention
        { headers: { Authorization: `Bearer ${token}` } }
      )),
    );
  }
}
