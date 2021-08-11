import { Subscription } from 'rxjs';
import { Component, Input, OnChanges, OnDestroy, SimpleChanges } from '@angular/core';
import { canCurrentUserViewItemContent } from '../../helpers/item-permissions';
import { GetItemChildrenService, ItemChild } from '../../http-services/get-item-children.service';
import { ItemData } from '../../services/item-datasource.service';
import { bestAttemptFromResults } from 'src/app/shared/helpers/attempts';
import { ItemRouter } from 'src/app/shared/routing/item-router';
import { typeCategoryOfItem } from 'src/app/shared/helpers/item-type';

interface ItemChildAdditions {
  isLocked: boolean,
  result?: {
    attemptId: string,
    validated: boolean,
    score: number,
  },
}

@Component({
  selector: 'alg-chapter-children',
  templateUrl: './chapter-children.component.html',
  styleUrls: [ './chapter-children.component.scss' ],
})
export class ChapterChildrenComponent implements OnChanges, OnDestroy {
  @Input() itemData?: ItemData;

  state: 'loading' | 'error' | 'empty' | 'ready' | 'ready-missing-validation' = 'loading';
  children: (ItemChild&ItemChildAdditions)[] = [];

  constructor(
    private getItemChildrenService: GetItemChildrenService,
    private itemRouter: ItemRouter,
  ) {}

  private subscription?: Subscription;

  ngOnChanges(_changes: SimpleChanges): void {
    this.reloadData();
  }

  click(child: ItemChild&ItemChildAdditions): void {
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

  private reloadData(): void {
    if (this.itemData?.currentResult) {
      this.state = 'loading';
      this.subscription?.unsubscribe();
      this.subscription = this.getItemChildrenService
        .get(this.itemData.item.id, this.itemData.currentResult.attemptId)
        .subscribe({
          next: children => {
            this.children = children.map(child => {
              const res = bestAttemptFromResults(child.results);
              return {
                ...child,
                isLocked: !canCurrentUserViewItemContent(child),
                result: res === null ? undefined : {
                  attemptId: res.attemptId,
                  validated: res.validated,
                  score: res.scoreComputed,
                },
              };
            });

            if (this.children.length === 0) this.state = 'empty';
            else if (this.itemData?.currentResult?.validated ||
              this.children.filter(item => item.category === 'Validation')
                .every(item => item.result && item.result.validated)) this.state = 'ready';
            else this.state = 'ready-missing-validation';
          },
          error: _err => {
            this.state = 'error';
          }
        });
    } else {
      this.state = 'error';
    }
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
  }
}
