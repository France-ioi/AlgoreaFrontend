import { Component, Input, OnChanges } from '@angular/core';
import { ItemChild } from './item-children';
import { ItemData } from '../../services/item-datasource.service';
import { GetItemChildrenService } from '../../http-services/get-item-children.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'alg-item-children-edit',
  templateUrl: './item-children-edit.component.html',
  styleUrls: [ './item-children-edit.component.scss' ]
})
export class ItemChildrenEditComponent implements OnChanges {
  @Input() itemData?: ItemData;

  state: 'loading' | 'error' | 'empty' | 'ready' = 'ready';
  data: ItemChild[] = [];

  private subscription?: Subscription;

  constructor(
    private getItemChildrenService: GetItemChildrenService,
  ) {}

  ngOnChanges(): void {
    this.reloadData();
  }

  reloadData(): void {
    if (this.itemData?.currentResult) {
      this.state = 'loading';
      this.subscription?.unsubscribe();
      this.subscription = this.getItemChildrenService
        .get(this.itemData.item.id, this.itemData.currentResult.attemptId)
        .subscribe(children => {
          this.data = children.map((child, idx) => ({
            id: child.id,
            title: child.string.title,
            order: idx
          }));
          this.state = this.data.length ? 'ready' : 'empty';
        },
        _err => {
          this.state = 'error';
        }
        );
    } else {
      this.state = 'error';
    }
  }

}
