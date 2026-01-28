import { createFeatureAlt } from 'src/app/utils/store/feature_creator';
import { reducer } from './notification.reducer';
import { selectors } from './notification.selectors';
import * as actions from './notification.actions';

export const fromNotification = createFeatureAlt({
  name: 'notification',
  reducer,
  extraSelectors: ({ selectNotificationState }) => ({ ...selectors(selectNotificationState) }),
  actionGroups: actions
});
