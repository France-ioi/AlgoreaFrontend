import { Component, Input, OnChanges, OnDestroy, SimpleChanges } from '@angular/core';
import { Subscription } from 'rxjs';
import { canCurrentUserViewItemContent } from '../../helpers/item-permissions';
import { GetItemChildrenService, ItemChild } from '../../http-services/get-item-children.service';
import { ItemData } from '../../services/item-datasource.service';
import { bestAttemptFromResults } from 'src/app/shared/helpers/attempts';

interface ItemChildAdditional {
  isLocked: boolean,
  result: {
    is_validated: boolean,
    current_score: number,
  },
}

@Component({
  selector: 'alg-chapter-children',
  templateUrl: './chapter-children.component.html',
  styleUrls: ['./chapter-children.component.scss'],
})
export class ChapterChildrenComponent implements OnChanges, OnDestroy {
  @Input() itemData: ItemData;

  state: 'loading' | 'ready' | 'error' = 'loading';
  children: (ItemChild&ItemChildAdditional)[] = [];

  constructor(private getItemChildrenService: GetItemChildrenService) {}

  private subscription?: Subscription;

  ngOnChanges(_changes: SimpleChanges): void {
    this.reloadData();
  }

  private reloadData() {
    if (this.itemData.currentResult) {
      this.state = 'loading';
      this.subscription?.unsubscribe();
      this.subscription = this.getItemChildrenService
        .get(this.itemData.item.id, this.itemData.currentResult.attemptId)
        .subscribe(
          children => {
            this.children = children.map(child => {
              const res = bestAttemptFromResults(child.results);
              return {...child,
                isLocked: !canCurrentUserViewItemContent(child),
                result: {
                  is_validated: res === null ? false : res.validated,
                  current_score: res === null ? 0 : res.score_computed,
                },
              };
            });
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

  ngOnDestroy() {
    this.subscription?.unsubscribe();
  }
}
