import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { RouterLink, UrlTree } from '@angular/router';
import { TooltipDirective } from '../tooltip/tooltip.directive';
import { formatUser, UserBaseWithId } from 'src/app/groups/models/user';
import { GroupRouter } from 'src/app/models/routing/group-router';
import { rawGroupRoute } from 'src/app/models/routing/group-route';

@Component({
  selector: 'alg-user-link-with-actions',
  templateUrl: './user-link-with-actions.component.html',
  styleUrls: [ './user-link-with-actions.component.scss' ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ RouterLink, TooltipDirective ],
  host: {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    '[class.actions-visible]': 'showActions()',
    // eslint-disable-next-line @typescript-eslint/naming-convention
    '(click)': 'onHostClick($event)',
    // eslint-disable-next-line @typescript-eslint/naming-convention
    '(document:click)': 'onDocumentClick()',
  },
})
export class UserLinkWithActionsComponent {
  private groupRouter = inject(GroupRouter);

  user = input.required<UserBaseWithId>();
  observeLink = input<string | UrlTree | readonly unknown[]>();
  showActions = signal(false);

  label = computed(() => formatUser(this.user()));
  profileLink = computed(() => this.groupRouter.url(rawGroupRoute({ id: this.user().id, isUser: true })));

  onHostClick(event: Event): void {
    if (window.matchMedia('(hover: hover)').matches) return;
    event.stopPropagation();
    this.showActions.update(v => !v);
  }

  onDocumentClick(): void {
    this.showActions.set(false);
  }
}
