import { Component, Input, OnChanges } from '@angular/core';
import { ItemChild } from './item-children';
import { ItemData } from '../../services/item-datasource.service';
import { GetItemChildrenService } from '../../http-services/get-item-children.service';
import { Subscription } from 'rxjs';
import { map } from 'rxjs/operators';
import { FormGroup } from '@angular/forms';

@Component({
  selector: 'alg-item-children-edit',
  templateUrl: './item-children-edit.component.html',
  styleUrls: [ './item-children-edit.component.scss' ]
})
export class ItemChildrenEditComponent implements OnChanges {
  @Input() itemData?: ItemData;
  @Input() parentForm?: FormGroup;

  state: 'loading' | 'error' | 'ready' = 'ready';
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
        .pipe(
          map(children => children.map(child => ({
            id: child.id,
            title: child.string.title,
            order: child.order
          })).sort((a, b) => a.order - b.order))
        ).subscribe(children => {
          this.data = children;
          this.state = 'ready';
        },
        _err => {
          this.state = 'error';
        });
    } else {
      this.state = 'error';
    }
  }

  orderChanged(): void {
    if (this.state == 'error') return;
    this.parentForm?.patchValue({
      children: this.data.map((child, idx) => ({ item_id: child.id, order: idx })),
    });
  }

}
