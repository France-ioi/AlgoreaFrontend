import { Component, Input, OnChanges, OnDestroy, SimpleChanges } from '@angular/core';
import { Subscription } from 'rxjs';
import { GetItemChildrenService, ItemChild } from '../../http-services/get-item-children.service';
import { ItemData } from '../../services/item-datasource.service';

@Component({
  selector: 'alg-chapter-children',
  templateUrl: './chapter-children.component.html',
  styleUrls: ['./chapter-children.component.scss'],
})
export class ChapterChildrenComponent implements OnChanges, OnDestroy {
  @Input() itemData: ItemData;

  state: 'loading' | 'ready' | 'error' = 'loading';
  children: ItemChild[] = [];

  constructor(private getItemChildrenService: GetItemChildrenService) {}

  private subscription?: Subscription;

  ngOnChanges(_changes: SimpleChanges): void {
    this.reloadData();
  }

  private reloadData() {
    if (this.itemData.attemptId) {
      this.state = 'loading';
      this.subscription?.unsubscribe();
      this.subscription = this.getItemChildrenService
        .get(this.itemData.item.id, this.itemData.attemptId)
        .subscribe(
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

  ngOnDestroy() {
    if (this.subscription)
      this.subscription.unsubscribe();
  }
}
