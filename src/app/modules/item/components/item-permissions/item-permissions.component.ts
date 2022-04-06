import { Component, Input } from '@angular/core';
import { ItemData } from '../../services/item-datasource.service';
import { WatchedGroup } from 'src/app/core/services/group-watching.service';

@Component({
  selector: 'alg-item-permissions',
  templateUrl: './item-permissions.component.html',
  styleUrls: [ './item-permissions.component.scss' ],
})
export class ItemPermissionsComponent {
  @Input() itemData?: ItemData;
  @Input() watchedGroup?: WatchedGroup;
}
