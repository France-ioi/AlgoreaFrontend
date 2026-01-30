import { createActionGroup, emptyProps, props } from '@ngrx/store';
import { Notification } from 'src/app/models/notification';
import { State } from './notification.state';

export const notificationApiActions = createActionGroup({
  source: 'Notification API',
  events: {
    fetchStateChanged: props<{ fetchState: State['notificationsState'] }>(),
  },
});

/**
 * Placeholder action group for future use (e.g., manual refresh from a component)
 */
export const notificationTriggerActions = createActionGroup({
  source: 'Notification Trigger',
  events: {
    refresh: emptyProps(),
  },
});

export const notificationWebsocketActions = createActionGroup({
  source: 'Notification WebSocket',
  events: {
    notificationReceived: props<{ notification: Notification }>(),
  },
});
