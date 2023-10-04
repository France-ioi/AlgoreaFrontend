import { Component, Input } from '@angular/core';
import { ItemTypeCategory } from '../../../../shared/helpers/item-type';
import { ItemChildWithAdditions } from './item-children';
import { RouteUrlPipe } from 'src/app/shared/pipes/routeUrl';
import { ItemRouteWithAttemptPipe, ContentTypeFromItemPipe } from 'src/app/shared/pipes/itemRoute';
import { SkillProgressComponent } from '../../../shared-components/components/skill-progress/skill-progress.component';
import { ScoreRingComponent } from '../../../shared-components/components/score-ring/score-ring.component';
import { RouterLink } from '@angular/router';
import { NgIf, NgClass, NgFor } from '@angular/common';

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
    ItemRouteWithAttemptPipe,
    ContentTypeFromItemPipe,
    RouteUrlPipe,
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
