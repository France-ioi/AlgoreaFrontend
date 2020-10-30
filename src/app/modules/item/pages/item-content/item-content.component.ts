import { Component } from '@angular/core';
import { ItemDataSource } from '../../services/item-datasource.service';

@Component({
  selector: 'alg-item-content',
  templateUrl: './item-content.component.html',
  styleUrls: [ './item-content.component.scss' ]
})
export class ItemContentComponent {

    itemData$ = this.itemDataSource.itemData$;

    constructor(
      private itemDataSource:ItemDataSource,
    ) {}
}
