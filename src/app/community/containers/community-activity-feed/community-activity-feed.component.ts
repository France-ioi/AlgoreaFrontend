import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { catchError, forkJoin, map, of, switchMap, take } from 'rxjs';
import { TaskValidationService } from '../../data-access/get-task-validations.service';
import { DisplayTaskValidation, RawTaskValidation } from '../../models/task-validation';
import { UserSessionService } from '../../../services/user-session.service';
import { GetUserService } from '../../../groups/data-access/get-user.service';
import { GetItemByIdService } from '../../../data-access/get-item-by-id.service';
import { formatUser } from '../../../groups/models/user';
import { fetchList } from '../../../utils/fetch-list';
import { LoadingComponent } from '../../../ui-components/loading/loading.component';
import { ErrorComponent } from '../../../ui-components/error/error.component';
import { RelativeTimeComponent } from '../../../ui-components/relative-time/relative-time.component';
import { GroupLinkPipe } from '../../../pipes/groupLink';
import { ItemRoutePipe } from '../../../pipes/itemRoute';
import { RouteUrlPipe } from '../../../pipes/routeUrl';

const MAX_ENTRIES = 10;

@Component({
  selector: 'alg-community-activity-feed',
  templateUrl: './community-activity-feed.component.html',
  styleUrls: [ './community-activity-feed.component.scss' ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterLink,
    LoadingComponent,
    ErrorComponent,
    RelativeTimeComponent,
    GroupLinkPipe,
    ItemRoutePipe,
    RouteUrlPipe,
  ],
})
export class CommunityActivityFeedComponent {
  private taskValidationService = inject(TaskValidationService);
  private userSessionService = inject(UserSessionService);
  private getUserService = inject(GetUserService);
  private getItemByIdService = inject(GetItemByIdService);

  private taskValidations = fetchList(() => this.taskValidationService.getLatest());
  taskValidationsState = this.taskValidations.state;

  private userNames = signal(new Map<string, string | null>());
  private itemTitles = signal(new Map<string, string | null>());

  entries = computed<DisplayTaskValidation[]>(() => {
    const state = this.taskValidationsState();
    if (!state?.isReady) return [];
    return state.data.slice(0, MAX_ENTRIES).map(v => ({
      ...v,
      date: new Date(v.time),
      userName: this.userNames().get(v.participantId),
      itemTitle: this.itemTitles().get(v.itemId),
    }));
  });

  constructor() {
    effect(() => {
      const state = this.taskValidationsState();
      if (state?.tag !== 'ready') return;
      this.resolveEntries(state.data.slice(0, MAX_ENTRIES));
    });
  }

  onRefresh(): void {
    this.taskValidations.refresh();
  }

  private resolveEntries(taskValidations: RawTaskValidation[]): void {
    const uniqueParticipantIds = [ ...new Set(taskValidations.map(v => v.participantId)) ];
    const uniqueItemIds = [ ...new Set(taskValidations.map(v => v.itemId)) ];

    this.resolveUsers(uniqueParticipantIds);
    this.resolveItems(uniqueItemIds);
  }

  private resolveUsers(participantIds: string[]): void {
    this.userSessionService.userProfile$.pipe(
      take(1),
      switchMap(currentUser => {
        const resolvers = participantIds.map(pid => {
          if (pid === currentUser.groupId) {
            return of({ id: pid, name: formatUser({
              login: currentUser.login,
              firstName: currentUser.profile?.firstName,
              lastName: currentUser.profile?.lastName,
            }) });
          }
          return this.getUserService.getForId(pid).pipe(
            map(user => ({ id: pid, name: formatUser(user) })),
            catchError(() => of({ id: pid, name: null as string | null })),
          );
        });
        return resolvers.length > 0 ? forkJoin(resolvers) : of([]);
      }),
    ).subscribe(results => {
      this.userNames.update(m => {
        const updated = new Map(m);
        for (const r of results) {
          updated.set(r.id, r.name);
        }
        return updated;
      });
    });
  }

  private resolveItems(itemIds: string[]): void {
    const resolvers = itemIds.map(itemId =>
      this.getItemByIdService.get(itemId).pipe(
        map(item => ({ id: itemId, title: item.string.title })),
        catchError(() => of({ id: itemId, title: null as string | null })),
      )
    );

    if (resolvers.length === 0) return;

    forkJoin(resolvers).subscribe(results => {
      this.itemTitles.update(m => {
        const updated = new Map(m);
        for (const r of results) {
          updated.set(r.id, r.title);
        }
        return updated;
      });
    });
  }
}
