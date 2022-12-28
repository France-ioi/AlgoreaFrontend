import { Component, Input, OnChanges, OnDestroy, SimpleChanges } from '@angular/core';
import { ReplaySubject, Subject } from 'rxjs';
import { distinctUntilChanged, map, switchMap } from 'rxjs/operators';
import { bestAttemptFromResults } from 'src/app/shared/helpers/attempts';
import { isASkill, typeCategoryOfItem } from 'src/app/shared/helpers/item-type';
import { ItemRouter } from 'src/app/shared/routing/item-router';
import { GetItemChildrenService, ItemChild } from '../../http-services/get-item-children.service';
import { ItemData } from '../../services/item-datasource.service';
import { mapToFetchState, readyData } from '../../../../shared/operators/state';
import { canCurrentUserViewContent } from 'src/app/shared/models/domain/item-view-permission';

export interface ItemChildWithAdditions extends ItemChild {
  isLocked: boolean,
  result?: {
    attemptId: string,
    score: number,
  },
}

@Component({
  selector: 'alg-sub-skills',
  templateUrl: './sub-skills.component.html',
  styleUrls: [ './sub-skills.component.scss' ]
})
export class SubSkillsComponent implements OnChanges, OnDestroy {
  @Input() itemData?: ItemData;

  private readonly params$ = new ReplaySubject<{ id: string, attemptId: string }>(1);
  private refresh$ = new Subject<void>();
  readonly state$ = this.params$.pipe(
    distinctUntilChanged((a, b) => a.id === b.id && a.attemptId === b.attemptId),
    switchMap(({ id, attemptId }) => this.getItemChildrenService.get(id, attemptId)),
    map(children =>
      children
        .map(child => {
          const res = bestAttemptFromResults(child.results);
          return {
            ...child,
            isLocked: !canCurrentUserViewContent(child),
            result: res === null ? undefined : {
              attemptId: res.attemptId,
              score: res.scoreComputed,
            },
          };
        })
    ),
    mapToFetchState({ resetter: this.refresh$ }),
  );
  skills$ = this.state$.pipe(readyData(), map(children => children.filter(child => isASkill(child))));
  activities$ = this.state$.pipe(readyData(), map(children => children.filter(child => !isASkill(child))));

  constructor(
    private getItemChildrenService: GetItemChildrenService,
    private itemRouter: ItemRouter,
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
