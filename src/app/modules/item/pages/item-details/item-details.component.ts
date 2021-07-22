import { Component } from '@angular/core';
import { UserSessionService } from 'src/app/shared/services/user-session.service';
import { canCurrentUserViewItemContent } from '../../helpers/item-permissions';
import { ItemDataSource } from '../../services/item-datasource.service';
import { mapStateData } from 'src/app/shared/operators/state';
import { LayoutService } from '../../../../shared/services/layout.service';

@Component({
  selector: 'alg-item-details',
  templateUrl: './item-details.component.html',
  styleUrls: [ './item-details.component.scss' ],
})
export class ItemDetailsComponent {

  itemLoadingstate$ = this.itemDataSource.state$.pipe(
    mapStateData(data => ({ ...data, showAccessCodeField: data.item.promptToJoinGroupByCode &&
      !canCurrentUserViewItemContent(data.item) && !this.userService.isCurrentUserTemp() }))
  );

  fullFrameContent$ = this.layoutService.fullFrameContent$;

  constructor(
    private userService: UserSessionService,
    private itemDataSource: ItemDataSource,
    private layoutService: LayoutService,
  ) {}

  reloadItem(): void {
    this.itemDataSource.refreshItem();
  }

}
