import { Component, computed, inject, input } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { httpResource } from '@angular/common/http';
import { map } from 'rxjs/operators';
import { APPCONFIG } from 'src/app/config';
import { UserSessionService } from 'src/app/services/user-session.service';
import { LoadingComponent } from 'src/app/ui-components/loading/loading.component';
import { ErrorComponent } from 'src/app/ui-components/error/error.component';
import { GroupLinkPipe } from 'src/app/pipes/groupLink';
import { ItemOwner, parseItemOwners } from '../../models/item-owner';

@Component({
  selector: 'alg-item-owners',
  templateUrl: './item-owners.component.html',
  styleUrl: './item-owners.component.scss',
  imports: [
    LoadingComponent,
    ErrorComponent,
    RouterLink,
    GroupLinkPipe,
  ],
})
export class ItemOwnersComponent {
  private config = inject(APPCONFIG);
  private userSession = inject(UserSessionService);

  itemId = input.required<string>();

  private currentUserGroupId = toSignal(
    this.userSession.session$.pipe(map(session => session?.groupId)),
    { initialValue: undefined },
  );

  protected awaitingUser = computed(() => this.currentUserGroupId() === undefined);

  protected ownersResource = httpResource<ItemOwner[]>(() => (
    { url: `${this.config.apiUrl}/items/${this.itemId()}/owners` }
  ), { parse: parseItemOwners });

  protected displayOwners = computed(() =>
    (this.ownersResource.value() ?? []).filter(o => o.id !== this.currentUserGroupId()),
  );

  protected includesSelf = computed(() =>
    (this.ownersResource.value() ?? []).some(o => o.id === this.currentUserGroupId()),
  );

  protected ownerCount = computed(() => (this.ownersResource.value() ?? []).length);

  protected onRefresh(): void {
    this.ownersResource.reload();
  }
}
