import { Component, Input, OnChanges, OnDestroy } from '@angular/core';
import { Group } from '../../http-services/get-group-by-id.service';
import { GetItemByIdService } from '../../../item/http-services/get-item-by-id.service';
import { ReplaySubject, of, Subject } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { mapToFetchState } from '../../../../shared/operators/state';
import { GrantedPermissionsService } from '../../http-services/granted-permissions.service';
import { GroupRouter } from '../../../../shared/routing/group-router';
import { rawGroupRoute } from '../../../../shared/routing/group-route';

@Component({
  selector: 'alg-group-access',
  templateUrl: './group-access.component.html',
  styleUrls: [ './group-access.component.scss' ],
})
export class GroupAccessComponent implements OnChanges, OnDestroy {
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

  constructor(
    private getItemByIdService: GetItemByIdService,
    private grantedPermissionsService: GrantedPermissionsService,
    private groupRouter: GroupRouter,
  ) {
  }

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

  onGroupClick(groupId: string): void {
    this.groupRouter.navigateTo(rawGroupRoute({ id: groupId, isUser: false }));
  }

  refreshPermissions(): void {
    this.permissionsRefresh$.next();
  }
}
