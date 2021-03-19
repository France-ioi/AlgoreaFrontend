import { Component, Input } from '@angular/core';
import { CurrentContentService, EditAction } from 'src/app/shared/services/current-content.service';
import { ItemData } from '../../services/item-datasource.service';

@Component({
  selector: 'alg-item-header',
  templateUrl: './item-header.component.html',
  styleUrls: [ './item-header.component.scss' ]
})
export class ItemHeaderComponent {
  @Input() itemData?: ItemData;

  constructor(
    private currentContent: CurrentContentService,
  ) {}

  onEditButtonClicked(): void {
    this.currentContent.editAction.next(EditAction.StartEditing);
  }
}
