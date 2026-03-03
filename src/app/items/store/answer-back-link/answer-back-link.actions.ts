import { createActionGroup, emptyProps, props } from '@ngrx/store';
import { AnswerBackLink } from './answer-back-link.state';

export const sourcePageActions = createActionGroup({
  source: 'Source page',
  events: {
    registerAnswerBackLink: props<{ backLink: AnswerBackLink }>(),
  },
});

export const answerBackLinkActions = createActionGroup({
  source: 'Answer back link',
  events: {
    clear: emptyProps(),
  },
});
