import { Component, input, OnDestroy } from '@angular/core';
import { GroupData } from '../../models/group-data';
import { AsyncPipe } from '@angular/common';
import { GetItemByIdService } from 'src/app/data-access/get-item-by-id.service';
import { distinctUntilChanged, map, switchMap } from 'rxjs/operators';
import { of, Subject } from 'rxjs';
import { toObservable } from '@angular/core/rxjs-interop';
import { mapToFetchState } from 'src/app/utils/operators/state';
import { RouterLink } from '@angular/router';
import { ItemRoutePipe } from 'src/app/pipes/itemRoute';
import { RouteUrlPipe } from 'src/app/pipes/routeUrl';
import { ButtonIconComponent } from 'src/app/ui-components/button-icon/button-icon.component';

@Component({
  selector: 'alg-group-header',
  templateUrl: './group-header.component.html',
  styleUrls: [ './group-header.component.scss' ],
  imports: [
    AsyncPipe,
    RouterLink,
    ItemRoutePipe,
    RouteUrlPipe,
    ButtonIconComponent,
  ]
})
export class GroupHeaderComponent implements OnDestroy {
  groupData = input.required<GroupData>();

  private refreshSubject = new Subject<void>();
  state$ = toObservable(this.groupData).pipe(
    map(groupData => groupData.group.rootActivityId),
    distinctUntilChanged(),
    switchMap(rootActivityId =>
      (rootActivityId === null ? of(null) : this.getItemByIdService.get(rootActivityId).pipe(
        mapToFetchState({ resetter: this.refreshSubject }),
      ))
    ),
  );

  constructor(private getItemByIdService: GetItemByIdService) {}

  ngOnDestroy(): void {
    this.refreshSubject.complete();
  }

  refresh(): void {
    this.refreshSubject.next(undefined);
  }
}
