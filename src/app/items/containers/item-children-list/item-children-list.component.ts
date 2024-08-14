import { Component, Input } from '@angular/core';
import { ItemTypeCategory } from 'src/app/items/models/item-type';
import { ItemChildWithAdditions } from './item-children';
import { RouteUrlPipe } from 'src/app/pipes/routeUrl';
import { ItemRoutePipe, ItemRouteWithExtraPipe } from 'src/app/pipes/itemRoute';
import { SkillProgressComponent } from 'src/app/ui-components/skill-progress/skill-progress.component';
import { ScoreRingComponent } from 'src/app/ui-components/score-ring/score-ring.component';
import { RouterLink } from '@angular/router';
import { NgIf, NgClass, NgFor } from '@angular/common';
import { MessageIconComponent } from '../../../ui-components/message-icon/message-icon.component';

@Component({
  selector: 'alg-item-children-list',
  templateUrl: './item-children-list.component.html',
  styleUrls: [ './item-children-list.component.scss' ],
  standalone: true,
  imports: [
    NgIf,
    NgClass,
    NgFor,
    RouterLink,
    ScoreRingComponent,
    SkillProgressComponent,
    ItemRoutePipe,
    ItemRouteWithExtraPipe,
    RouteUrlPipe,
    MessageIconComponent,
  ],
})
export class ItemChildrenListComponent {
  @Input() type: ItemTypeCategory = 'activity';
  @Input() children: ItemChildWithAdditions[] = [];
  @Input() emptyMessage?: string;
  @Input() routeParams?: {
    path: string[],
    parentAttemptId: string,
  };
}
