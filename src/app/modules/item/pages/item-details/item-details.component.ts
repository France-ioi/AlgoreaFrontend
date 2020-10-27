import { Component, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { CurrentContentService } from 'src/app/shared/services/current-content.service';
import { ItemDataSource } from '../../services/item-datasource.service';

@Component({
  selector: 'alg-item-details',
  templateUrl: './item-details.component.html',
  styleUrls: [ './item-details.component.scss' ],
})
export class ItemDetailsComponent implements OnDestroy {

  itemLoadingstate$ = this.itemDataSource.state$;
  item$ = this.itemDataSource.item$; // as template is not able to infer properly the type

  subscription: Subscription;

  constructor(
    private currentContent: CurrentContentService,
    private itemDataSource: ItemDataSource,
  ) {
    this.subscription = this.itemDataSource.item$.subscribe(
      item => this.currentContent.editState.next(item.permissions.can_edit === 'none' ? 'non-editable' : 'editable')
    );
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
    this.currentContent.editState.next('non-editable');
  }
}
