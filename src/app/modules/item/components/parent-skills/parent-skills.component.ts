import { Component, Input, OnChanges, OnDestroy, SimpleChanges } from '@angular/core';
import { ReplaySubject, Subject } from 'rxjs';
import { distinctUntilChanged, map, switchMap } from 'rxjs/operators';
import { typeCategoryOfItem } from 'src/app/shared/helpers/item-type';
import { ItemRouter } from 'src/app/shared/routing/item-router';
import { GetItemParentsService, ItemParent } from '../../http-services/get-item-parents.service';
import { ItemData } from '../../services/item-datasource.service';
import { mapToFetchState } from '../../../../shared/operators/state';
import { canCurrentUserViewContent } from 'src/app/shared/models/domain/item-view-permission';

interface ParentSkillAdditions {
  isLocked: boolean,
}

@Component({
  selector: 'alg-parent-skills',
  templateUrl: './parent-skills.component.html',
  styleUrls: [ './parent-skills.component.scss' ]
})
export class ParentSkillsComponent implements OnChanges, OnDestroy {
  @Input() itemData?: ItemData;

  private readonly params$ = new ReplaySubject<{ id: string, attemptId: string }>(1);
  private refresh$ = new Subject<void>();
  readonly state$ = this.params$.pipe(
    distinctUntilChanged((a, b) => a.id === b.id && a.attemptId === b.attemptId),
    switchMap(({ id, attemptId }) => this.getItemParentsService.get(id, attemptId)),
    map(parents => parents.map(parent => ({ ...parent, isLocked: !canCurrentUserViewContent(parent) }))),
    mapToFetchState({ resetter: this.refresh$ }),
  );

  constructor(
    private getItemParentsService: GetItemParentsService,
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

  click(parent: ItemParent&ParentSkillAdditions): void {
    if (!this.itemData) return;

    this.itemRouter.navigateTo({
      contentType: typeCategoryOfItem(parent),
      id: parent.id,
      path: this.itemData.route.path.slice(0, -1),
      attemptId: parent.result.attemptId,
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
