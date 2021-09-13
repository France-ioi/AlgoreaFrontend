import { Component, Input } from '@angular/core';
import { rawGroupRoute } from 'src/app/shared/routing/group-route';
import { GroupRouter } from 'src/app/shared/routing/group-router';
import { GroupShortInfo } from '../../http-services/get-group-by-id.service';

const MAX_ITEMS_DISPLAY = 4;

@Component({
  selector: 'alg-group-links',
  templateUrl: './group-links.component.html',
  styleUrls: [ './group-links.component.scss' ]
})
export class GroupLinksComponent {
  @Input() items?: GroupShortInfo[];

  maxItemsDisplay = MAX_ITEMS_DISPLAY;

  constructor(private groupRouter: GroupRouter) { }

  onButtonClick(item: GroupShortInfo): void {
    this.groupRouter.navigateTo(rawGroupRoute({ id: item.id, isUser: false }));
  }

}
