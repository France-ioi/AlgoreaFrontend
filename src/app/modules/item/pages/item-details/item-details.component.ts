import { Component } from '@angular/core';
import { CurrentContentService } from 'src/app/shared/services/current-content.service';
import { ItemDataSource } from '../../services/item-datasource.service';

@Component({
  selector: 'alg-item-details',
  templateUrl: './item-details.component.html',
  styleUrls: ['./item-details.component.scss'],
})
export class ItemDetailsComponent {

  itemLoadingstate$ = this.itemDataSource.state$;
  item$ = this.itemDataSource.item$; // as template is not able to infer properly the type

  constructor(
    private currentContent: CurrentContentService,
    private itemDataSource: ItemDataSource,
  ) {}
}
