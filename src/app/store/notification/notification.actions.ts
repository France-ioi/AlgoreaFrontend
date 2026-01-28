import { createActionGroup, emptyProps, props } from '@ngrx/store';
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
