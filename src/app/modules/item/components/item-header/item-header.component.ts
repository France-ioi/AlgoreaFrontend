import { Component, Input } from '@angular/core';
import { ModeAction, ModeService } from 'src/app/shared/services/mode.service';
import { ItemData } from '../../services/item-datasource.service';

@Component({
  selector: 'alg-item-header',
  templateUrl: './item-header.component.html',
  styleUrls: [ './item-header.component.scss' ]
})
export class ItemHeaderComponent {
  @Input() itemData?: ItemData;

  constructor(
    private modeService: ModeService,
  ) {}

  onEditButtonClicked(): void {
    this.modeService.modeActions$.next(ModeAction.StartEditing);
  }
}
