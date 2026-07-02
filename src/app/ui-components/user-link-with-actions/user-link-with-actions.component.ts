import { Component, computed, inject, input, signal } from '@angular/core';
import { RouterLink, UrlTree } from '@angular/router';
import { TooltipDirective } from '../tooltip/tooltip.directive';
import { formatUser, UserBaseWithId } from 'src/app/groups/models/user';
import { GroupRouter } from 'src/app/models/routing/group-router';
import { rawGroupRoute } from 'src/app/models/routing/group-route';
import { deviceSupportsHover } from 'src/app/utils/device-supports-hover';

@Component({
  selector: 'alg-user-link-with-actions',
  templateUrl: './user-link-with-actions.component.html',
  styleUrl: './user-link-with-actions.component.scss',
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
    if (deviceSupportsHover()) return;
    event.stopPropagation();
    this.showActions.update(v => !v);
  }

  onDocumentClick(): void {
    this.showActions.set(false);
  }
}
