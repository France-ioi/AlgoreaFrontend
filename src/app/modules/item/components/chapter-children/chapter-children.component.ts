import { combineLatest, ReplaySubject, Subject } from 'rxjs';
import { Component, Input, OnChanges, OnDestroy, SimpleChanges } from '@angular/core';
import { GetItemChildrenService, ItemChild } from '../../http-services/get-item-children.service';
import { ItemData } from '../../services/item-datasource.service';
import { bestAttemptFromResults } from 'src/app/shared/helpers/attempts';
import { ItemRouter } from 'src/app/shared/routing/item-router';
import { typeCategoryOfItem } from 'src/app/shared/helpers/item-type';
import { distinctUntilChanged, map, switchMap } from 'rxjs/operators';
import { mapToFetchState } from '../../../../shared/operators/state';
import { canCurrentUserViewContent } from 'src/app/shared/models/domain/item-view-permission';
import { GroupWatchingService } from 'src/app/core/services/group-watching.service';
import { LayoutService } from '../../../../shared/services/layout.service';
import { ItemChildWithAdditions } from '../../helpers/item-children';

@Component({
  selector: 'alg-chapter-children',
  templateUrl: './chapter-children.component.html',
  styleUrls: [ './chapter-children.component.scss' ],
})
export class ChapterChildrenComponent implements OnChanges, OnDestroy {
  @Input() itemData?: ItemData;

  private readonly params$ = new ReplaySubject<{ id: string, attemptId: string }>(1);
  private refresh$ = new Subject<void>();
  readonly state$ = combineLatest([
    this.params$.pipe(distinctUntilChanged((a, b) => a.id === b.id && a.attemptId === b.attemptId)),
    this.groupWatchingService.watchedGroup$.pipe(map(watchedGroup => watchedGroup?.route.id)),
  ]).pipe(
    switchMap(([{ id, attemptId }, watchedGroupId ]) => this.getItemChildrenService.get(id, attemptId, { watchedGroupId })),
    map<ItemChild[], ItemChildWithAdditions[]>(itemChildren => itemChildren.map(child => {
      const res = bestAttemptFromResults(child.results);
      return {
        ...child,
        isLocked: !canCurrentUserViewContent(child),
        result: res === null ? undefined : {
          attemptId: res.attemptId,
          validated: res.validated,
          score: res.scoreComputed,
        },
      };
    })),
    map(children => ({
      children,
      missingValidation: !(this.itemData?.currentResult?.validated || children.filter(item => item.category === 'Validation')
        .every(item => item.result && item.result.validated)),
    })),
    mapToFetchState({ resetter: this.refresh$ }),
  );
  fullFrame$ = this.layoutService.fullFrame$;

  constructor(
    private getItemChildrenService: GetItemChildrenService,
    private groupWatchingService: GroupWatchingService,
    private itemRouter: ItemRouter,
    private layoutService: LayoutService,
  ) {}

  ngOnChanges(_changes: SimpleChanges): void {
    if (this.itemData?.currentResult) {
      this.params$.next({
        id: this.itemData.item.id,
        attemptId: this.itemData.currentResult.attemptId,
      });
    }
  }

  click(child: ItemChildWithAdditions): void {
    if (!this.itemData) return;
    const attemptId = child.result?.attemptId;
    const parentAttemptId = this.itemData.currentResult?.attemptId;
    if (!parentAttemptId) return; // unexpected: children have been loaded, so we are sure this item has an attempt
    this.itemRouter.navigateTo({
      contentType: typeCategoryOfItem(child),
      id: child.id,
      path: this.itemData.route.path.concat([ this.itemData.item.id ]),
      ...attemptId ? { attemptId: attemptId } : { parentAttemptId: parentAttemptId }
    });
  }

  ngOnDestroy(): void {
    this.params$.complete();
    this.refresh$.complete();
  }

  refresh(): void {
    this.refresh$.next();
  }
}
