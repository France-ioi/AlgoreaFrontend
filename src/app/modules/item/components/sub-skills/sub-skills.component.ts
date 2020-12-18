import { Component, Input, OnChanges, OnDestroy, SimpleChanges } from '@angular/core';
import { Subscription } from 'rxjs';
import { map } from 'rxjs/operators';
import { bestAttemptFromResults } from 'src/app/shared/helpers/attempts';
import { isASkill } from 'src/app/shared/helpers/item-type';
import { ItemRouter } from 'src/app/shared/services/item-router';
import { canCurrentUserViewItemContent } from '../../helpers/item-permissions';
import { GetItemChildrenService, ItemChild } from '../../http-services/get-item-children.service';
import { ItemData } from '../../services/item-datasource.service';

interface SubSkillAdditions {
  isLocked: boolean,
  result?: {
    attempt_id: string,
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

  state: 'loading' | 'error' | 'ready' = 'loading';
  children: (ItemChild&SubSkillAdditions)[] = [];

  private subscription?: Subscription;

  constructor(
    private getItemChildrenService: GetItemChildrenService,
    private itemRouter: ItemRouter,
  ) {}

  ngOnChanges(_changes: SimpleChanges): void {
    this.reloadData();
  }

  click(child: ItemChild&SubSkillAdditions): void {
    if (!this.itemData || child.isLocked) return;
    const attemptId = child.result?.attempt_id;
    const parentAttemptId = this.itemData.currentResult?.attemptId;
    if (!parentAttemptId) return; // unexpected: children have been loaded, so we are sure this item has an attempt
    this.itemRouter.navigateTo({
      id: child.id,
      path: this.itemData.route.path.concat([ this.itemData.item.id ]),
      ...attemptId ? { attemptId: attemptId } : { parentAttemptId: parentAttemptId }
    });
  }

  private reloadData(): void {
    if (this.itemData?.currentResult) {
      this.state = 'loading';
      this.subscription?.unsubscribe();
      this.subscription = this.getItemChildrenService.get(this.itemData.item.id, this.itemData.currentResult.attemptId).pipe(
        map(children =>
          children
            .filter(child => isASkill(child))
            .map(child => {
              const res = bestAttemptFromResults(child.results);
              return {
                ...child,
                isLocked: !canCurrentUserViewItemContent(child),
                result: res === null ? undefined : {
                  attempt_id: res.attempt_id,
                  score: res.score,
                },
              };
            })
        )
      ).subscribe(
        children => {
          this.children = children;
          this.state = 'ready';
        },
        _err => {
          this.state = 'error';
        }
      );
    } else {
      this.state = 'error';
    }
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
  }
}
