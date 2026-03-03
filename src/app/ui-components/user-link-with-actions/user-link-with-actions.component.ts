import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
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
})
export class UserLinkWithActionsComponent {
  private groupRouter = inject(GroupRouter);

  user = input.required<UserBaseWithId>();
  observeLink = input<string | UrlTree | readonly unknown[]>();

  label = computed(() => formatUser(this.user()));
  profileLink = computed(() => this.groupRouter.url(rawGroupRoute({ id: this.user().id, isUser: true })));
}
