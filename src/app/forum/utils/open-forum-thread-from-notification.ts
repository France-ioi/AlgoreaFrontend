import { Store } from '@ngrx/store';
import { catchError, map, Observable, of, tap } from 'rxjs';
import { GetItemByIdService } from 'src/app/data-access/get-item-by-id.service';
import { fromForum } from 'src/app/forum/store';
import { ForumNewMessageNotification } from 'src/app/models/notification';
import { itemRoute } from 'src/app/models/routing/item-route';
import { errorIsHTTPForbidden } from 'src/app/utils/errors';

/**
 * Loads the item title and opens the forum thread for a new-message notification.
 * Callers must subscribe (e.g. with take(1) or takeUntilDestroyed).
 */
export function openForumThreadFromNotification$(
  notification: ForumNewMessageNotification,
  getItemByIdService: GetItemByIdService,
  store: Store,
): Observable<void> {
  const { participantId, itemId } = notification.payload;
  return getItemByIdService.get(itemId).pipe(
    map(item => item.string.title),
    catchError(err => of(errorIsHTTPForbidden(err)
      ? $localize`Not visible content`
      : $localize`Error fetching content title`
    )),
    tap(title => {
      store.dispatch(fromForum.notificationActions.showThread({
        id: { participantId, itemId },
        item: { route: itemRoute('activity', itemId), title },
      }));
    }),
    map(() => undefined),
  );
}
