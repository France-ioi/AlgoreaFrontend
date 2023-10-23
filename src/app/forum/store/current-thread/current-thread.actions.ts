import { createActionGroup, emptyProps, props } from '@ngrx/store';
import { ThreadId } from '../../models/threads';

export const currentThreadActions = createActionGroup({
  source: 'Forum Current Thread',
  events: {
    toggleVisibility: emptyProps(),
    visibilityChange: props<{ visible: boolean }>(),
    idChange: props<{ id: ThreadId }>(),
    needInfoRefresh: emptyProps(),
  },
});
