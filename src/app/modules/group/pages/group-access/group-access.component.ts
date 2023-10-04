import { Component, Input, OnChanges, OnDestroy } from '@angular/core';
import { Group } from '../../http-services/get-group-by-id.service';
import { GetItemByIdService } from '../../../item/http-services/get-item-by-id.service';
import { ReplaySubject, of, Subject } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { mapToFetchState } from '../../../../shared/operators/state';
import { GrantedPermissionsService } from '../../http-services/granted-permissions.service';
import { GroupLinkPipe } from 'src/app/shared/pipes/groupLink';
import { GroupPermissionsComponent } from '../../components/group-permissions/group-permissions.component';
import { RouterLink } from '@angular/router';
import { ErrorComponent } from '../../../shared-components/components/error/error.component';
import { LoadingComponent } from '../../../shared-components/components/loading/loading.component';
import { SectionComponent } from '../../../shared-components/components/section/section.component';
import { NgIf, NgFor, AsyncPipe } from '@angular/common';

@Component({
  selector: 'alg-group-access',
  templateUrl: './group-access.component.html',
  styleUrls: [ './group-access.component.scss' ],
  standalone: true,
  imports: [
    NgIf,
    SectionComponent,
    LoadingComponent,
    ErrorComponent,
    NgFor,
    RouterLink,
    GroupPermissionsComponent,
    AsyncPipe,
    GroupLinkPipe,
  ],
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

  refreshPermissions(): void {
    this.permissionsRefresh$.next();
  }
}
