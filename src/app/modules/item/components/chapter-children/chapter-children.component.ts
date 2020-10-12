import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { GetItemChildrenService, ItemChild } from '../../http-services/get-item-children.service';
import { ItemData } from '../../services/item-datasource.service';

@Component({
  selector: 'alg-chapter-children',
  templateUrl: './chapter-children.component.html',
  styleUrls: ['./chapter-children.component.scss']
})
export class ChapterChildrenComponent implements OnChanges{

  @Input() itemData: ItemData;

  state: 'loading' | 'ready' | 'error' = 'loading';
  children: ItemChild[] = [];

  constructor(
    private getItemChildrenService: GetItemChildrenService,
  ) {}


  ngOnChanges(_changes: SimpleChanges): void {
    this.reloadData();
  }

  private reloadData() {
    if (this.itemData.attemptId) {
      this.state = 'loading';
      this.getItemChildrenService
        .get(this.itemData.item.id, this.itemData.attemptId)
        .subscribe(
          children => {
            this.children = children;
            this.state = 'ready';
        },
          _err => {
            this.state = 'error';
        });
    } else {
      this.state = 'error';
    }
  }
}
