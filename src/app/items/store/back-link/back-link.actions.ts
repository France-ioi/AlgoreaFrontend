import { createActionGroup, emptyProps, props } from '@ngrx/store';
import { BackLink } from './back-link.state';

export const sourcePageActions = createActionGroup({
  source: 'Source page',
  events: {
    registerBackLink: props<{ backLink: BackLink }>(),
  },
});

export const backLinkActions = createActionGroup({
  source: 'Back link',
  events: {
    clear: emptyProps(),
  },
});
