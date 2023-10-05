import { Component, Input, OnChanges, OnDestroy, SimpleChanges } from '@angular/core';
import { ReplaySubject, Subject } from 'rxjs';
import { distinctUntilChanged, map, switchMap } from 'rxjs/operators';
import { bestAttemptFromResults } from 'src/app/shared/helpers/attempts';
import { isASkill } from 'src/app/shared/helpers/item-type';
import { GetItemChildrenService } from '../../http-services/get-item-children.service';
import { ItemData } from '../../services/item-datasource.service';
import { mapToFetchState } from '../../../../shared/operators/state';
import { canCurrentUserViewContent } from 'src/app/shared/models/domain/item-view-permission';
import { ItemChildrenListComponent } from '../item-children-list/item-children-list.component';
import { ErrorComponent } from '../../../shared-components/components/error/error.component';
import { LoadingComponent } from '../../../shared-components/components/loading/loading.component';
import { NgIf, AsyncPipe } from '@angular/common';

@Component({
  selector: 'alg-sub-skills',
  templateUrl: './sub-skills.component.html',
  styleUrls: [ './sub-skills.component.scss' ],
  standalone: true,
  imports: [ NgIf, LoadingComponent, ErrorComponent, ItemChildrenListComponent, AsyncPipe ]
})
export class SubSkillsComponent implements OnChanges, OnDestroy {
  @Input() itemData?: ItemData;

  private readonly params$ = new ReplaySubject<{ id: string, attemptId: string }>(1);
  private refresh$ = new Subject<void>();
  readonly state$ = this.params$.pipe(
    distinctUntilChanged((a, b) => a.id === b.id && a.attemptId === b.attemptId),
    switchMap(({ id, attemptId }) => this.getItemChildrenService.get(id, attemptId)),
    map(children => {
      const newChildren = children
        .map(child => {
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
        });
      return {
        skills: newChildren.filter(child => isASkill(child)),
        activities: newChildren.filter(child => !isASkill(child)),
      };
    }),
    mapToFetchState({ resetter: this.refresh$ }),
  );

  constructor(
    private getItemChildrenService: GetItemChildrenService,
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
