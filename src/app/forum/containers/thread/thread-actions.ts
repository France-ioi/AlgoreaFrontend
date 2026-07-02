import { HttpErrorResponse } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { filter, map, share, switchMap, take } from 'rxjs/operators';
import { Store } from '@ngrx/store';
import { v4 as uuidv4 } from 'uuid';
import { ThreadMessageService } from 'src/app/data-access/thread-message.service';
import { UpdateThreadService } from 'src/app/data-access/update-thread.service';
import { ActionFeedbackService } from 'src/app/services/action-feedback.service';
import { ThreadId } from 'src/app/forum/models/threads';
import { isNotUndefined } from 'src/app/utils/null-undefined-predicates';
import { fromForum } from 'src/app/forum/store';
import { fromForum as forumActions } from '../../store';
import { AppConfig } from 'src/app/config';

export interface ThreadActionsDeps {
  store: Pick<Store, 'select' | 'dispatch'>,
  threadMessageService: ThreadMessageService,
  updateThreadService: UpdateThreadService,
  actionFeedbackService: ActionFeedbackService,
  config: AppConfig,
}

export interface SendThreadMessageContext extends ThreadActionsDeps {
  messageToSend: string,
  threadId: ThreadId,
  isThreadOpened: boolean,
  isParticipant: boolean,
  threadToken: string | undefined,
  setControlsDisabled: (disabled: boolean) => void,
  clearMessageToSend: () => void,
}

export function sendThreadMessage(ctx: SendThreadMessageContext): void {
  const messageToSend = ctx.messageToSend.trim();
  if (!messageToSend) return;
  ctx.setControlsDisabled(true);

  const token = ctx.threadToken;
  if (!token) throw new Error('unexpected: the thread token is empty');

  const uuid = uuidv4(); // used to track a message if we need to (future use)
  const prerequisite = ctx.isThreadOpened
    ? of(undefined)
    : changeThreadStatus({
      ...ctx,
      params: {
        open: true,
        threadId: ctx.threadId,
        isParticipant: ctx.isParticipant,
        messageCountIncrement: 1,
      },
    }).pipe(
      switchMap(() => ctx.store.select(fromForum.selectThreadStatusOpen)),
      filter(open => open),
      take(1),
      map(() => undefined)
    );
  prerequisite.pipe(
    switchMap(() => ctx.store.select(fromForum.selectThreadToken)),
    filter(isNotUndefined),
    take(1),
    switchMap(authToken =>
      ctx.threadMessageService.create(
        ctx.threadId.itemId,
        ctx.threadId.participantId,
        { text: messageToSend, uuid },
        { authToken },
      )
    ),
    switchMap(() => ctx.updateThreadService.update(
      ctx.threadId.itemId,
      ctx.threadId.participantId,
      { messageCountIncrement: 1 },
    )),
  ).subscribe({
    next: () => {
      ctx.clearMessageToSend();
      ctx.setControlsDisabled(false);
      // Auto-follow when sending a message (if not already following)
      ctx.store.dispatch(forumActions.threadPanelActions.autoFollowTriggered({ threadId: ctx.threadId }));
    },
    error: err => {
      ctx.setControlsDisabled(false);
      if (!(err instanceof HttpErrorResponse)) throw err;
    }
  });
}

export interface ChangeThreadStatusContext extends ThreadActionsDeps {
  params: { open: boolean, threadId: ThreadId, isParticipant: boolean, messageCountIncrement?: number },
}

export function changeThreadStatus(ctx: ChangeThreadStatusContext): Observable<void> {
  const payload = !ctx.params.open
    ? { status: 'closed' as const }
    : ctx.params.isParticipant
      ? {
        status: 'waiting_for_participant' as const,
        helperGroupId: ctx.config.allUsersGroupId,
        ...(ctx.params.messageCountIncrement !== undefined ? { messageCountIncrement: ctx.params.messageCountIncrement } : {}),
      }
      : {
        status: 'waiting_for_trainer' as const,
        helperGroupId: ctx.config.allUsersGroupId,
        ...(ctx.params.messageCountIncrement !== undefined ? { messageCountIncrement: ctx.params.messageCountIncrement } : {}),
      };
  const update$ = ctx.updateThreadService.update(
    ctx.params.threadId.itemId, ctx.params.threadId.participantId, payload,
  ).pipe(share());
  update$.subscribe({
    next: () => ctx.store.dispatch(fromForum.threadPanelActions.threadStatusChanged()),
    error: () => ctx.actionFeedbackService.unexpectedError(),
  });
  return update$;
}

export interface ChangeAssignmentContext extends ThreadActionsDeps {
  index: number,
  threadId: ThreadId,
}

export function changeAssignment(ctx: ChangeAssignmentContext): void {
  const payload = ctx.index === 0
    ? { status: 'waiting_for_participant' as const, helperGroupId: ctx.config.allUsersGroupId }
    : { status: 'waiting_for_trainer' as const, helperGroupId: ctx.config.allUsersGroupId };
  ctx.updateThreadService.update(ctx.threadId.itemId, ctx.threadId.participantId, payload).subscribe({
    next: () => ctx.store.dispatch(fromForum.threadPanelActions.threadStatusChanged()),
    error: () => ctx.actionFeedbackService.unexpectedError(),
  });
}
