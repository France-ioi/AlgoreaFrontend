import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { canCurrentUserViewItemContent } from '../../helpers/item-permissions';
import { ItemData } from '../../services/item-datasource.service';
import { UserSessionService } from 'src/app/shared/services/user-session.service';

@Component({
  selector: 'alg-item-header',
  templateUrl: './item-header.component.html',
  styleUrls: [ './item-header.component.scss' ]
})
export class ItemHeaderComponent implements OnChanges {
  @Input() itemData?: ItemData;
  @Output() reloadItem = new EventEmitter<void>();

  showAccessCodeField = false;

  constructor(
    private userService: UserSessionService,
  ) {}

  ngOnChanges(_changes: SimpleChanges): void {
    if (!this.itemData) return;
    this.showAccessCodeField = this.itemData.item.prompt_to_join_group_by_code
      && !canCurrentUserViewItemContent(this.itemData.item) && !this.userService.isCurrentUserTemp();
  }

  onReload(): void {
    this.reloadItem.emit();
  }
}
