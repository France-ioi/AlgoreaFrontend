import { Component, input } from '@angular/core';
import { ItemTypeCategory } from 'src/app/items/models/item-type';
import { ItemChildWithAdditions } from './item-children';
import { RouteUrlPipe } from 'src/app/pipes/routeUrl';
import { ItemRoutePipe, ItemRouteWithExtraPipe } from 'src/app/pipes/itemRoute';
import { SkillProgressComponent } from 'src/app/ui-components/skill-progress/skill-progress.component';
import { ScoreRingComponent } from 'src/app/ui-components/score-ring/score-ring.component';
import { RouterLink } from '@angular/router';
import { EmptyContentComponent } from 'src/app/ui-components/empty-content/empty-content.component';

@Component({
  selector: 'alg-item-children-list',
  templateUrl: './item-children-list.component.html',
  styleUrl: './item-children-list.component.scss',
  imports: [
    RouterLink,
    ScoreRingComponent,
    SkillProgressComponent,
    ItemRoutePipe,
    ItemRouteWithExtraPipe,
    RouteUrlPipe,
    EmptyContentComponent,
  ]
})
export class ItemChildrenListComponent {
  type = input<ItemTypeCategory>('activity');
  children = input.required<ItemChildWithAdditions[]>();
  emptyMessage = input<string>();
  routeParams = input<{
    path: string[],
    parentAttemptId: string,
  }>();
}
