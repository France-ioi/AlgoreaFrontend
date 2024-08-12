import { Component, Input, OnDestroy } from '@angular/core';
import { switchMap, filter } from 'rxjs/operators';
import { GetGroupByIdService } from 'src/app/groups/data-access/get-group-by-id.service';
import { ItemData } from '../../models/item-data';
import { mapToFetchState } from 'src/app/utils/operators/state';
import { isNotNull } from 'src/app/utils/null-undefined-predicates';
import { Subject } from 'rxjs';
import { ErrorComponent } from 'src/app/ui-components/error/error.component';
import { LoadingComponent } from 'src/app/ui-components//loading/loading.component';
import { GroupProgressGridComponent } from '../group-progress-grid/group-progress-grid.component';
import { NgIf, AsyncPipe } from '@angular/common';
import { Store } from '@ngrx/store';
import { fromObservation } from 'src/app/store/observation';

@Component({
  selector: 'alg-chapter-group-progress',
  templateUrl: './chapter-group-progress.component.html',
  styleUrls: [ './chapter-group-progress.component.scss' ],
  standalone: true,
  imports: [ NgIf, GroupProgressGridComponent, LoadingComponent, ErrorComponent, AsyncPipe ]
})
export class ChapterGroupProgressComponent implements OnDestroy {

  @Input() itemData?: ItemData;

  private refresh$ = new Subject<void>();
  state$ = this.store.select(fromObservation.selectObservedGroupId).pipe(
    filter(isNotNull),
    switchMap(observedGroupId => this.getGroupByIdService.get(observedGroupId)),
    mapToFetchState({ resetter: this.refresh$ }),
  );

  constructor(
    private store: Store,
    private getGroupByIdService: GetGroupByIdService,
  ) {}

  ngOnDestroy(): void {
    this.refresh$.complete();
  }

  refresh(): void {
    this.refresh$.next();
  }
}
