import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { ItemNavigationService } from 'src/app/core/http-services/item-navigation.service';
import { ItemRoute } from 'src/app/shared/routing/item-route';
import { ItemRouter } from 'src/app/shared/routing/item-router';
import { ModeAction, ModeService } from 'src/app/shared/services/mode.service';
import { ItemData } from '../../services/item-datasource.service';

@Component({
  selector: 'alg-item-header',
  templateUrl: './item-header.component.html',
  styleUrls: [ './item-header.component.scss' ]
})
export class ItemHeaderComponent implements OnChanges {
  @Input() itemData?: ItemData;

  navigationNeighbors: { parent: ItemRoute|null, left: ItemRoute|null, right: ItemRoute|null } = { parent: null, left: null, right: null };

  constructor(
    private modeService: ModeService,
    private itemNavigationService :ItemNavigationService,
    private itemRouter: ItemRouter,
  ) {}

  ngOnChanges(_changes: SimpleChanges): void {
    if (!this.itemData) return;

    this.itemNavigationService.getNavigationNeighbors(this.itemData.route).subscribe(data => {
      this.navigationNeighbors = data;
    });
  }

  onEditButtonClicked(): void {
    this.modeService.modeActions$.next(ModeAction.StartEditing);
  }

  onParentClicked(): void {
    if (this.navigationNeighbors?.parent) {
      this.itemRouter.navigateTo(this.navigationNeighbors.parent);
    }
  }

  onLeftClicked(): void {
    if (this.navigationNeighbors?.left) {
      this.itemRouter.navigateTo(this.navigationNeighbors.left);
    }
  }

  onRightClicked(): void {
    if (this.navigationNeighbors?.right) {
      this.itemRouter.navigateTo(this.navigationNeighbors.right);
    }
  }
}
