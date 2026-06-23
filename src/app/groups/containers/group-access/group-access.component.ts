import { Component, DestroyRef, inject, input } from '@angular/core';
import { Group } from '../../models/group';
import { GetItemByIdService } from 'src/app/data-access/get-item-by-id.service';
import { of, Subject } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { mapToFetchState } from 'src/app/utils/operators/state';
import { GrantedPermissionsService } from '../../data-access/granted-permissions.service';
import { GroupLinkPipe } from 'src/app/pipes/groupLink';
import { GroupPermissionsComponent } from '../group-permissions/group-permissions.component';
import { RouterLink } from '@angular/router';
import { ErrorComponent } from 'src/app/ui-components/error/error.component';
import { LoadingComponent } from 'src/app/ui-components/loading/loading.component';
import { AsyncPipe } from '@angular/common';
import { toObservable } from '@angular/core/rxjs-interop';

@Component({
  selector: 'alg-group-access',
  templateUrl: './group-access.component.html',
  styleUrl: './group-access.component.scss',
  imports: [
    LoadingComponent,
    ErrorComponent,
    RouterLink,
    GroupPermissionsComponent,
    AsyncPipe,
    GroupLinkPipe,
  ]
})
export class GroupAccessComponent {
  private getItemByIdService = inject(GetItemByIdService);
  private grantedPermissionsService = inject(GrantedPermissionsService);
  private destroyRef = inject(DestroyRef);

  group = input.required<Group>();

  private refresh$ = new Subject<void>();
  private permissionsRefresh$ = new Subject<void>();

  private group$ = toObservable(this.group);

  rootActivityState$ = this.group$.pipe(
    switchMap(({ rootActivityId }) => {
      if (!rootActivityId) {
        return of(null);
      }
      return this.getItemByIdService.get(rootActivityId);
    }),
    mapToFetchState({ resetter: this.refresh$ }),
  );

  permissionState$ = this.group$.pipe(
    switchMap(group => this.grantedPermissionsService.get(group.id)),
    mapToFetchState({ resetter: this.permissionsRefresh$ }),
  );

  constructor() {
    this.destroyRef.onDestroy(() => {
      this.refresh$.complete();
      this.permissionsRefresh$.complete();
    });
  }

  refresh(): void {
    this.refresh$.next();
  }

  refreshPermissions(): void {
    this.permissionsRefresh$.next();
  }
}
