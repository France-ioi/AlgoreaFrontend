import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, switchMap, Observable } from 'rxjs';
import { z } from 'zod';
import { APPCONFIG } from '../config';
import { IdentityTokenService } from '../services/auth/identity-token.service';
import { decodeSnakeCase } from '../utils/operators/decode';

// Payload schemas for specific notification types
const forumNewMessagePayloadSchema = z.object({
  participantId: z.string(),
  itemId: z.string(),
  time: z.number(),
  text: z.string(),
  authorId: z.string(),
  uuid: z.string(),
});

export type ForumNewMessagePayload = z.infer<typeof forumNewMessagePayloadSchema>;

// Base notification schema
const baseNotificationSchema = z.object({
  sk: z.number(),
  readTime: z.number().optional(),
});

// Discriminated union for typed notifications
const forumNewMessageNotificationSchema = baseNotificationSchema.extend({
  notificationType: z.literal('forum.new_message'),
  payload: forumNewMessagePayloadSchema,
});

const genericNotificationSchema = baseNotificationSchema.extend({
  notificationType: z.string(),
  payload: z.record(z.string(), z.unknown()),
});

// Union type that tries forum.new_message first, falls back to generic
const notificationSchema = z.union([
  forumNewMessageNotificationSchema,
  genericNotificationSchema,
]);

const notificationsResponseSchema = z.object({
  notifications: z.array(notificationSchema),
});

export type ForumNewMessageNotification = z.infer<typeof forumNewMessageNotificationSchema>;
export type GenericNotification = z.infer<typeof genericNotificationSchema>;
export type Notification = z.infer<typeof notificationSchema>;
export type NotificationsResponse = z.infer<typeof notificationsResponseSchema>;

export function isForumNewMessageNotification(n: Notification): n is ForumNewMessageNotification {
  return n.notificationType === 'forum.new_message';
}

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
