import { Component, Input, OnChanges, OnDestroy, inject } from '@angular/core';
import { Group } from '../../models/group';
import { GetItemByIdService } from 'src/app/data-access/get-item-by-id.service';
import { ReplaySubject, of, Subject } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { mapToFetchState } from 'src/app/utils/operators/state';
import { GrantedPermissionsService } from '../../data-access/granted-permissions.service';
import { GroupLinkPipe } from 'src/app/pipes/groupLink';
import { GroupPermissionsComponent } from '../group-permissions/group-permissions.component';
import { RouterLink } from '@angular/router';
import { ErrorComponent } from 'src/app/ui-components/error/error.component';
import { LoadingComponent } from 'src/app/ui-components/loading/loading.component';
import { AsyncPipe } from '@angular/common';

@Component({
  selector: 'alg-group-access',
  templateUrl: './group-access.component.html',
  styleUrls: [ './group-access.component.scss' ],
  imports: [
    LoadingComponent,
    ErrorComponent,
    RouterLink,
    GroupPermissionsComponent,
    AsyncPipe,
    GroupLinkPipe,
  ]
})
export class GroupAccessComponent implements OnChanges, OnDestroy {
  private getItemByIdService = inject(GetItemByIdService);
  private grantedPermissionsService = inject(GrantedPermissionsService);

  @Input() group?: Group;

  private readonly group$ = new ReplaySubject<Group>(1);

  private refresh$ = new Subject<void>();
  rootActivityState$ = this.group$.pipe(
    switchMap(({ rootActivityId }) => {
      if (!rootActivityId) {
        return of(null);
      }
      return this.getItemByIdService.get(rootActivityId);
    }),
    mapToFetchState({ resetter: this.refresh$ }),
  );

  private permissionsRefresh$ = new Subject<void>();
  permissionState$ = this.group$.pipe(
    switchMap(group => this.grantedPermissionsService.get(group.id)),
    mapToFetchState({ resetter: this.permissionsRefresh$ }),
  );

  ngOnChanges(): void {
    if (this.group) {
      this.group$.next(this.group);
    }
  }

  ngOnDestroy(): void {
    this.group$.complete();
    this.refresh$.complete();
  }

  refresh(): void {
    this.refresh$.next();
  }

  refreshPermissions(): void {
    this.permissionsRefresh$.next();
  }
}
