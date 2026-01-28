import { Actions, createEffect, ofType } from '@ngrx/effects';
import { inject } from '@angular/core';
import { filter, map } from 'rxjs';
import { websocketClientActions } from '../websocket/websocket.actions';
import {
  ForumWsMessage,
  forumWsMessageSchema,
  GradeUpdateForumWsMessage,
  isGradeUpdateForumWsMessage,
  isNewSubmissionForumWsMessage,
  isUserMessageForumWsMessage,
  NewSubmissionForumWsMessage,
} from '../../models/websocket-forum-messages';
import { websocketIncomingMessageActions } from './websocket-incoming-message.actions';
import {
  convertGradeUpdateWsMessageToSubmissionEvent,
  convertNewSubmissionWsMessageToSubmissionEvent,
  convertWsMessageToMessageEvent,
} from '../../models/thread-events-conversions';

function isSubmissionRelatedMessage(msg: ForumWsMessage): msg is NewSubmissionForumWsMessage | GradeUpdateForumWsMessage {
  return isNewSubmissionForumWsMessage(msg) || isGradeUpdateForumWsMessage(msg);
}

export const websocketIncomingMessageEffect = createEffect(
  (
    actions$ = inject(Actions),
  ) => actions$.pipe(
    ofType(websocketClientActions.messageReceived),
    map(({ message }) => forumWsMessageSchema.safeParse(message)),
    filter(result => result.success),
    map(result => result.data),
    filter(isUserMessageForumWsMessage),
    map(message => websocketIncomingMessageActions.forumMessageReceived({
      threadId: { participantId: message.participantId, itemId: message.itemId },
      message: convertWsMessageToMessageEvent(message),
    })),
  ),
  { functional: true }
);

export const websocketIncomingSubmissionEffect = createEffect(
  (
    actions$ = inject(Actions),
  ) => actions$.pipe(
    ofType(websocketClientActions.messageReceived),
    map(({ message }) => forumWsMessageSchema.safeParse(message)),
    filter(result => result.success),
    map(result => result.data),
    filter(isSubmissionRelatedMessage),
    map(message => {
      const threadId = { participantId: message.participantId, itemId: message.itemId };
      const submission = isNewSubmissionForumWsMessage(message)
        ? convertNewSubmissionWsMessageToSubmissionEvent(message)
        : convertGradeUpdateWsMessageToSubmissionEvent(message);
      return websocketIncomingMessageActions.forumSubmissionReceived({ threadId, submission });
    }),
  ),
  { functional: true }
);
