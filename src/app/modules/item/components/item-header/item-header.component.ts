import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { filter } from 'rxjs/operators';
import { ActivityNavTreeService, SkillNavTreeService } from 'src/app/core/services/navigation/item-nav-tree.service';
import { isASkill } from 'src/app/shared/helpers/item-type';
import { isItemInfo } from 'src/app/shared/models/content/item-info';
import { CurrentContentService } from 'src/app/shared/services/current-content.service';
import { ModeAction, ModeService } from 'src/app/shared/services/mode.service';
import { ItemData } from '../../services/item-datasource.service';

@Component({
  selector: 'alg-item-header',
  templateUrl: './item-header.component.html',
  styleUrls: [ './item-header.component.scss' ]
})
export class ItemHeaderComponent implements OnChanges {
  @Input() itemData?: ItemData;

  private activityNavigationNeighbors$ = this.activitiyNavTreeService.navigationNeighbors$;
  private skillNavigationNeighbors$ = this.skillNavTreeService.navigationNeighbors$;
  navigationNeighbors$ = this.activityNavigationNeighbors$;

  content$ = this.currentContentService.content$.pipe(filter(isItemInfo));

  constructor(
    private modeService: ModeService,
    private activitiyNavTreeService: ActivityNavTreeService,
    private skillNavTreeService: SkillNavTreeService,
    private currentContentService: CurrentContentService,
  ) {}

  ngOnChanges(_changes: SimpleChanges): void {
    if (!this.itemData) return;
    this.navigationNeighbors$ = isASkill(this.itemData.item) ? this.skillNavigationNeighbors$ : this.activityNavigationNeighbors$;
  }

  onEditButtonClicked(): void {
    this.modeService.modeActions$.next(ModeAction.StartEditing);
  }

}
