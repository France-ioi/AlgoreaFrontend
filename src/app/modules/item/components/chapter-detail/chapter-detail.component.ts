import { Component } from '@angular/core';
import { EMPTY } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { GetItemChildrenService, ItemChild } from '../../http-services/get-item-children.service';
import { ItemDataSource } from '../../services/item-datasource.service';

@Component({
  selector: 'alg-chapter-detail',
  templateUrl: './chapter-detail.component.html',
  styleUrls: ['./chapter-detail.component.scss']
})
export class ChapterDetailComponent {

  item$ = this.itemDataSource.item$;

  state: 'loading' | 'ready' | 'error' = 'loading';

  constructor(
    private itemDataSource: ItemDataSource,
    private getItemChildrenService: GetItemChildrenService,
  ) {
    this.reloadData();
  }

  children: ItemChild[] = [];

  private reloadData() {
    this.state = 'loading';
    this.itemDataSource.itemData$.pipe(
      switchMap(itemData => {
        if (!itemData.attemptId) return EMPTY;
        return this.getItemChildrenService.get(itemData.item.id, itemData.attemptId);
      }),
    ).subscribe((children: ItemChild[]) => {
      this.children = children;
      this.state = 'ready';
    },
      _err => {
        this.state = 'error';
      });
  }
}
