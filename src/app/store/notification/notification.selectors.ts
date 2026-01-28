import { MemoizedSelector, Selector, createSelector } from '@ngrx/store';
import { State } from './notification.state';
import { RootState } from 'src/app/utils/store/root_state';
import { FetchState } from 'src/app/utils/state';
import { Notification } from 'src/app/data-access/notification.service';

interface NotificationSelectors<T extends RootState> {
  selectNotificationsState: MemoizedSelector<T, FetchState<Notification[]>>,
  selectUnreadCount: MemoizedSelector<T, number>,
}

export function selectors<T extends RootState>(selectState: Selector<T, State>): NotificationSelectors<T> {
  const selectNotificationsState = createSelector(
    selectState,
    state => state.notificationsState
  );

  const selectUnreadCount = createSelector(
    selectNotificationsState,
    state => (state.isReady ? state.data.filter(n => n.readTime === undefined).length : 0)
  );

  return {
    selectNotificationsState,
    selectUnreadCount,
  };
}
