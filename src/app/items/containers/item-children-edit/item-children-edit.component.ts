import { Component, EventEmitter, Input, OnChanges, OnDestroy, OnInit, Output } from '@angular/core';
import { ItemData } from '../../models/item-data';
import { GetItemChildrenService, isVisibleItemChild } from '../../../data-access/get-item-children.service';
import { Observable, ReplaySubject, Subject, Subscription } from 'rxjs';
import { distinctUntilChanged, map, share, switchMap } from 'rxjs/operators';
import { isASkill, ItemTypeCategory, itemTypeCategoryEnum as c } from 'src/app/items/models/item-type';
import { bestAttemptFromResults } from 'src/app/items/models/attempts';
import { mapToFetchState, readyData } from 'src/app/utils/operators/state';
import { FetchState } from 'src/app/utils/state';
import { ErrorComponent } from 'src/app/ui-components/error/error.component';
import { LoadingComponent } from 'src/app/ui-components/loading/loading.component';
import { ItemChildrenEditListComponent } from '../item-children-edit-list/item-children-edit-list.component';
import { AsyncPipe } from '@angular/common';
import { BaseChildData, PossiblyInvisibleChildData } from 'src/app/items/models/item-children-edit';

@Component({
  selector: 'alg-item-children-edit',
  templateUrl: './item-children-edit.component.html',
  styleUrls: [ './item-children-edit.component.scss' ],
  imports: [ ItemChildrenEditListComponent, LoadingComponent, ErrorComponent, AsyncPipe ]
})
export class ItemChildrenEditComponent implements OnInit, OnDestroy, OnChanges {
  @Input() itemData?: ItemData;

  activities: PossiblyInvisibleChildData[] = [];
  skills: PossiblyInvisibleChildData[] = [];

  private subscription?: Subscription;
  @Output() childrenChanges = new EventEmitter<PossiblyInvisibleChildData[]>();

  private readonly params$ = new ReplaySubject<{ id: string, attemptId: string }>(1);
  private readonly refresh$ = new Subject<void>();
  readonly state$: Observable<FetchState<PossiblyInvisibleChildData[]>> = this.params$.pipe(
    distinctUntilChanged((a, b) => a.id === b.id && a.attemptId === b.attemptId),
    switchMap(({ id, attemptId }) => this.getItemChildrenService.getWithInvisibleItems(id, attemptId)),
    map(children => children
      .sort((a, b) => a.order - b.order)
      .map((child): PossiblyInvisibleChildData => {
        const baseChildData: BaseChildData = {
          scoreWeight: child.scoreWeight,
          contentViewPropagation: child.contentViewPropagation,
          editPropagation: child.editPropagation,
          grantViewPropagation: child.grantViewPropagation,
          upperViewLevelsPropagation: child.upperViewLevelsPropagation,
          watchPropagation: child.watchPropagation,
          permissions: child.permissions,
          type: child.type,
        };

        if (isVisibleItemChild(child)) {
          const res = bestAttemptFromResults(child.results);
          return {
            ...baseChildData,
            id: child.id,
            title: child.string.title,
            isVisible: true,
            result: res === null ? undefined : {
              attemptId: res.attemptId,
              validated: res.validated,
              score: res.scoreComputed,
            },
          };
        }

        return {
          ...baseChildData,
          id: child.id,
          isVisible: false,
        };
      })
    ),
    mapToFetchState({ resetter: this.refresh$ }),
    share(),
  );

  constructor(
    private getItemChildrenService: GetItemChildrenService,
  ) {}

  ngOnInit(): void {
    this.subscription = this.state$.pipe(readyData()).subscribe(data => {
      this.skills = data.filter(item => isASkill(item));
      this.activities = data.filter(item => !isASkill(item));
    });
  }

  ngOnDestroy(): void {
    this.refresh$.complete();
    this.params$.complete();
    this.subscription?.unsubscribe();
  }

  ngOnChanges(): void {
    if (this.itemData?.currentResult) {
      this.params$.next({
        id: this.itemData.item.id,
        attemptId: this.itemData.currentResult.attemptId,
      });
    }
  }

  reloadData(): void {
    this.refresh$.next();
  }

  reset(): void {
    this.reloadData();
  }

  onDataChange(children: PossiblyInvisibleChildData[], type: ItemTypeCategory = c.activity): void {
    if (type === c.skill) {
      this.skills = children;
    } else {
      this.activities = children;
    }
    this.childrenChanges.emit([ ...this.skills, ...this.activities ]);
  }
}
