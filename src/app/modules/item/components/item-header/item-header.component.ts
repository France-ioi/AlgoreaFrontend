import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { ActivityNavTreeService, SkillNavTreeService } from 'src/app/core/services/navigation/item-nav-tree.service';
import { isASkill } from 'src/app/shared/helpers/item-type';
import { DiscussionService } from '../../services/discussion.service';
import { ItemData } from '../../services/item-datasource.service';

@Component({
  selector: 'alg-item-header',
  templateUrl: './item-header.component.html',
  styleUrls: [ './item-header.component.scss' ]
})
export class ItemHeaderComponent implements OnChanges {
  @Input() itemData?: ItemData;

  private activityNavigationNeighbors$ = this.activityNavTreeService.navigationNeighbors$;
  private skillNavigationNeighbors$ = this.skillNavTreeService.navigationNeighbors$;
  navigationNeighbors$ = this.activityNavigationNeighbors$;
  discussionState$ = this.discussionService.state$;

  constructor(
    private activityNavTreeService: ActivityNavTreeService,
    private skillNavTreeService: SkillNavTreeService,
    private discussionService: DiscussionService
  ) {}

  ngOnChanges(_changes: SimpleChanges): void {
    if (!this.itemData) return;
    this.navigationNeighbors$ = isASkill(this.itemData.item) ? this.skillNavigationNeighbors$ : this.activityNavigationNeighbors$;
  }

  toggleThread(): void {
    this.discussionService.toggleVisibility();
  }

}
