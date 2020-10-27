import { Subscription } from 'rxjs';
import { Component, Input, OnChanges, OnDestroy, SimpleChanges } from '@angular/core';
import { canCurrentUserViewItemContent } from '../../helpers/item-permissions';
import { GetItemChildrenService, ItemChild } from '../../http-services/get-item-children.service';
import { ItemData } from '../../services/item-datasource.service';
import { bestAttemptFromResults } from 'src/app/shared/helpers/attempts';
import { Router } from '@angular/router';
import { itemDetailsRoute } from 'src/app/shared/services/nav-types';

interface ItemChildAdditions {
  isLocked: boolean,
  result?: {
    validated: boolean,
    score: number,
  },
}

@Component({
  selector: 'alg-chapter-children',
  templateUrl: './chapter-children.component.html',
  styleUrls: ['./chapter-children.component.scss'],
})
export class ChapterChildrenComponent implements OnChanges, OnDestroy {
  @Input() itemData: ItemData;

  state: 'loading' | 'error' | 'empty' | 'ready' | 'ready-missing-validation' = 'loading';
  children: (ItemChild&ItemChildAdditions)[] = [];

  constructor(
    private getItemChildrenService: GetItemChildrenService,
    private router: Router,
  ) {}

  private subscription?: Subscription;

  ngOnChanges(_changes: SimpleChanges): void {
    this.reloadData();
  }

  click(child: ItemChild&ItemChildAdditions): void {
    if (child.isLocked) return;
    void this.router.navigate(itemDetailsRoute({
      itemId: child.id,
      itemPath: this.itemData.nav.itemPath.concat([this.itemData.item.id]),
      attemptId: this.itemData.currentResult?.attemptId,
      }));
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
              return {
                ...child,
                isLocked: !canCurrentUserViewItemContent(child),
                result: res === null ? undefined : {
                  validated: res.validated,
                  score: res.score,
                },
              };
            });

            if (this.children.length === 0) this.state = 'empty';
            else if (this.itemData.currentResult?.validated ||
              this.children.filter(item => item.category === 'Validation')
              .every(item => item.result && item.result.validated)) this.state = 'ready';
            else this.state = 'ready-missing-validation';
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
