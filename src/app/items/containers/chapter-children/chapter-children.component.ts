import { combineLatest, Subject } from 'rxjs';
import { Component, inject, input, DestroyRef } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { GetItemChildrenService } from '../../../data-access/get-item-children.service';
import { ItemData } from '../../models/item-data';
import { distinctUntilChanged, filter, map } from 'rxjs/operators';
import { switchMapToFetchState } from 'src/app/utils/operators/state';
import { isNotUndefined } from 'src/app/utils/null-undefined-predicates';
import { ItemChildrenListComponent } from '../item-children-list/item-children-list.component';
import { ErrorComponent } from 'src/app/ui-components/error/error.component';
import { LoadingComponent } from 'src/app/ui-components/loading/loading.component';
import { AsyncPipe } from '@angular/common';
import { ButtonComponent } from 'src/app/ui-components/button/button.component';
import { Store } from '@ngrx/store';
import { fromObservation } from 'src/app/store/observation';
import { LayoutService } from 'src/app/services/layout.service';
import { ChapterChildrenGridComponent } from './chapter-children-grid.component';
import { TwoLevelsContainerSectionComponent } from './two-levels-container-section.component';
import { mapChildWithAdditions } from '../item-children-list/map-item-child-with-additions';
import { groupTwoLevelsSections, twoLevelsSectionTrackId } from './group-two-levels-sections';

@Component({
  selector: 'alg-chapter-children',
  templateUrl: './chapter-children.component.html',
  styleUrl: './chapter-children.component.scss',
  imports: [
    LoadingComponent,
    ErrorComponent,
    ItemChildrenListComponent,
    AsyncPipe,
    ButtonComponent,
    ChapterChildrenGridComponent,
    TwoLevelsContainerSectionComponent,
  ]
})
export class ChapterChildrenComponent {
  private store = inject(Store);
  private getItemChildrenService = inject(GetItemChildrenService);

  readonly itemData = input.required<ItemData>();

  layoutService = inject(LayoutService);

  /** Expose for the TwoLevels template track expression (no arrow fns in templates). */
  readonly sectionTrackId = twoLevelsSectionTrackId;

  private readonly refresh$ = new Subject<void>();

  constructor() {
    inject(DestroyRef).onDestroy(() => this.refresh$.complete());
  }

  private readonly params$ = toObservable(this.itemData).pipe(
    map(itemData => (itemData.currentResult
      ? {
        id: itemData.item.id,
        attemptId: itemData.currentResult.attemptId,
        currentResultValidated: itemData.currentResult.validated,
        showLevel2Children: itemData.item.displaySettings.childrenLayout === 'TwoLevels',
      }
      : undefined)),
    filter(isNotUndefined),
    distinctUntilChanged((a, b) =>
      a.id === b.id
      && a.attemptId === b.attemptId
      && a.currentResultValidated === b.currentResultValidated
      && a.showLevel2Children === b.showLevel2Children),
  );

  readonly state$ = combineLatest([
    this.params$,
    this.store.select(fromObservation.selectObservedGroupId),
  ]).pipe(
    switchMapToFetchState(
      ([{ id, attemptId, currentResultValidated, showLevel2Children }, observedGroupId ]) =>
        this.getItemChildrenService.get(id, attemptId, {
          watchedGroupId: observedGroupId ?? undefined,
          showLevel2Children,
          includeDescription: showLevel2Children,
        }).pipe(
          map(itemChildren => itemChildren.map(mapChildWithAdditions)),
          map(children => ({
            children,
            sections: showLevel2Children ? groupTwoLevelsSections(children) : [],
            missingValidation: !(currentResultValidated || children.filter(item => item.category === 'Validation')
              .every(item => item.result && item.result.validated)),
          })),
        ),
      { resetter: this.refresh$ },
    ),
  );

  leftMenuShown = toSignal(this.layoutService.leftMenu$.pipe(map(({ shown }) => shown)), { initialValue: true });

  refresh(): void {
    this.refresh$.next();
  }

  showLeftMenu(): void {
    this.layoutService.toggleLeftMenu(true);
  }
}
