import { Component, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { UserSessionService } from 'src/app/shared/services/user-session.service';
import { canCurrentUserViewItemContent } from '../../helpers/item-permissions';
import { ItemDataSource } from '../../services/item-datasource.service';

@Component({
  selector: 'alg-item-details',
  templateUrl: './item-details.component.html',
  styleUrls: [ './item-details.component.scss' ],
})
export class ItemDetailsComponent implements OnDestroy {

  itemLoadingstate$ = this.itemDataSource.state$;
  itemData$ = this.itemDataSource.itemData$; // as template is not able to infer properly the type
  showAccessCodeField = false;

  subscription: Subscription;

  constructor(
    private userService: UserSessionService,
    private itemDataSource: ItemDataSource,
  ) {
    this.subscription = this.itemDataSource.item$.subscribe(item => {
      this.showAccessCodeField = item.prompt_to_join_group_by_code
        && !canCurrentUserViewItemContent(item) && !this.userService.isCurrentUserTemp();
    });
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  reloadItem(): void {
    this.itemDataSource.refreshItem();
  }

}
