import { Component, Input, OnChanges, Output, EventEmitter } from '@angular/core';
import { ItemData } from '../../services/item-datasource.service';
import { GetItemChildrenService } from '../../http-services/get-item-children.service';
import { Subscription } from 'rxjs';
import { map } from 'rxjs/operators';
import { FormGroup } from '@angular/forms';

export interface ChildData {
  id: string,
  title: string | null,
}

@Component({
  selector: 'alg-item-children-edit',
  templateUrl: './item-children-edit.component.html',
  styleUrls: [ './item-children-edit.component.scss' ]
})
export class ItemChildrenEditComponent implements OnChanges {
  @Input() itemData?: ItemData;
  @Input() parentForm?: FormGroup;

  state: 'loading' | 'error' | 'ready' = 'ready';
  data: ChildData[] = [];

  private subscription?: Subscription;
  @Output() change = new EventEmitter<ChildData[]>();

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
          map(children => children
            .sort((a, b) => a.order - b.order)
            .map(child => ({ id: child.id, title: child.string.title }))
          )
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
    this.change.emit(this.data);
  }

}
