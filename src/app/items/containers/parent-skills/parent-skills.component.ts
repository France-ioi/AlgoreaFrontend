import { Component, Input, OnChanges, OnDestroy, SimpleChanges } from '@angular/core';
import { ReplaySubject, Subject } from 'rxjs';
import { distinctUntilChanged, map, switchMap } from 'rxjs/operators';
import { GetItemParentsService } from '../../data-access/get-item-parents.service';
import { ItemData } from '../../models/item-data';
import { mapToFetchState } from 'src/app/utils/operators/state';
import { canCurrentUserViewContent } from 'src/app/items/models/item-view-permission';
import { ItemChildrenListComponent } from '../item-children-list/item-children-list.component';
import { ErrorComponent } from 'src/app/ui-components/error/error.component';
import { LoadingComponent } from 'src/app/ui-components/loading/loading.component';
import { AsyncPipe, SlicePipe } from '@angular/common';

@Component({
  selector: 'alg-parent-skills',
  templateUrl: './parent-skills.component.html',
  styleUrls: [ './parent-skills.component.scss' ],
  imports: [ LoadingComponent, ErrorComponent, ItemChildrenListComponent, AsyncPipe, SlicePipe ]
})
export class ParentSkillsComponent implements OnChanges, OnDestroy {
  @Input() itemData?: ItemData;

  private readonly params$ = new ReplaySubject<{ id: string, attemptId: string }>(1);
  private refresh$ = new Subject<void>();
  readonly state$ = this.params$.pipe(
    distinctUntilChanged((a, b) => a.id === b.id && a.attemptId === b.attemptId),
    switchMap(({ id, attemptId }) => this.getItemParentsService.get(id, attemptId)),
    map(parents => parents.map(parent => ({
      ...parent,
      isLocked: !canCurrentUserViewContent(parent),
      result: parent.result === null ? undefined : {
        attemptId: parent.result.attemptId,
        validated: parent.result.validated,
        score: parent.result.scoreComputed,
      },
    }))),
    mapToFetchState({ resetter: this.refresh$ }),
  );

  constructor(
    private getItemParentsService: GetItemParentsService,
  ) {}

  ngOnChanges(_changes: SimpleChanges): void {
    if (this.itemData?.currentResult) {
      this.params$.next({
        id: this.itemData.item.id,
        attemptId: this.itemData.currentResult.attemptId,
      });
    }
  }

  ngOnDestroy(): void {
    this.params$.complete();
    this.refresh$.complete();
  }

  refresh(): void {
    this.refresh$.next();
  }
}
