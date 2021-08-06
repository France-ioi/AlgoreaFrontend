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

  navigationNeighbors: {parent: ItemRoute|null, left: ItemRoute|null, right: ItemRoute|null}|null = null;

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

  onNavigationClicked(mode: 'parent'|'left'|'right'): void {
    if (!this.itemData || !this.navigationNeighbors) return;

    if (mode === 'parent' && this.navigationNeighbors.parent) {
      this.itemRouter.navigateTo(this.navigationNeighbors.parent);
    } else if (mode === 'left' && this.navigationNeighbors.left) {
      this.itemRouter.navigateTo(this.navigationNeighbors.left);
    } else if (mode === 'right' && this.navigationNeighbors.right) {
      this.itemRouter.navigateTo(this.navigationNeighbors.right);
    }
  }
}
