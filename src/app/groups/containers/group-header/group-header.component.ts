import { Component, input } from '@angular/core';
import { GroupData } from '../../services/group-datasource.service';
import { AsyncPipe, JsonPipe, NgIf } from '@angular/common';
import { GetItemByIdService } from 'src/app/data-access/get-item-by-id.service';
import { distinctUntilChanged, map, switchMap } from 'rxjs/operators';
import { of, merge, Subject } from 'rxjs';
import { toObservable } from '@angular/core/rxjs-interop';
import { fetchingState } from 'src/app/utils/state';
import { LoadingComponent } from 'src/app/ui-components/loading/loading.component';
import { ErrorComponent } from 'src/app/ui-components/error/error.component';
import { mapToFetchState } from 'src/app/utils/operators/state';
import { ButtonDirective } from 'primeng/button';

@Component({
  selector: 'alg-group-header',
  templateUrl: './group-header.component.html',
  styleUrls: [ './group-header.component.scss' ],
  standalone: true,
  imports: [ NgIf, AsyncPipe, JsonPipe, LoadingComponent, ErrorComponent, ButtonDirective ],
})
export class GroupHeaderComponent {
  groupData = input.required<GroupData>();

  private refreshSubject = new Subject<void>();
  state$ = toObservable(this.groupData).pipe(
    map(groupData => groupData.group.rootActivityId),
    distinctUntilChanged(),
    switchMap(rootActivityId =>
      (rootActivityId === null ? of(null) : merge(
        of(fetchingState()),
        this.getItemByIdService.get(rootActivityId).pipe(
          mapToFetchState({ resetter: this.refreshSubject }),
        ),
      ))
    ),
  );

  constructor(private getItemByIdService: GetItemByIdService) {}

  refresh(): void {
    this.refreshSubject.next(undefined);
  }
}
