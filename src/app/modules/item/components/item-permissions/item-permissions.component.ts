import { Component, Input } from '@angular/core';
import { ItemData } from '../../services/item-datasource.service';
import { WatchedGroup } from '../../../../shared/services/user-session.service';

@Component({
  selector: 'alg-item-permissions',
  templateUrl: './item-permissions.component.html',
  styleUrls: [ './item-permissions.component.scss' ],
})
export class ItemPermissionsComponent {
  @Input() itemData?: ItemData;
  @Input() watchedGroup?: WatchedGroup;
}
