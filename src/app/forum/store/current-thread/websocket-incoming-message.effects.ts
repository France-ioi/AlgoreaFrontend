import { Actions, createEffect, ofType } from '@ngrx/effects';
import { inject } from '@angular/core';
import { filter, map } from 'rxjs';
import { websocketClientActions } from '../websocket/websocket.actions';
import { userMessageForumWsMessageSchema } from '../../models/websocket-forum-messages';
import { websocketIncomingMessageActions } from './websocket-incoming-message.actions';
import { convertWsMessageToMessageEvent } from '../../models/thread-events-convertions';

export const websocketIncomingMessageEffect = createEffect(
  (
    actions$ = inject(Actions),
  ) => actions$.pipe(
    ofType(websocketClientActions.messageReceived),
    map(({ message }) => userMessageForumWsMessageSchema.safeParse(message)),
    filter(result => result.success),
    map(result => result.data),
    map(message => websocketIncomingMessageActions.forumMessageReceived({
      threadId: { participantId: message.participantId, itemId: message.itemId },
      message: convertWsMessageToMessageEvent(message),
    })),
  ),
  { functional: true }
);
