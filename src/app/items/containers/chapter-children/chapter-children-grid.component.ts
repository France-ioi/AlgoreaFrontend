import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ItemChildWithAdditions } from '../item-children-list/item-children';
import { RouteUrlPipe } from 'src/app/pipes/routeUrl';
import { ItemRoutePipe, ItemRouteWithExtraPipe } from 'src/app/pipes/itemRoute';
import { ScoreRingComponent } from 'src/app/ui-components/score-ring/score-ring.component';

@Component({
  selector: 'alg-chapter-children-grid',
  templateUrl: './chapter-children-grid.component.html',
  styleUrl: './chapter-children-grid.component.scss',
  imports: [
    RouterLink,
    ScoreRingComponent,
    ItemRoutePipe,
    ItemRouteWithExtraPipe,
    RouteUrlPipe,
  ],
})
export class ChapterChildrenGridComponent {
  children = input.required<ItemChildWithAdditions[]>();
  path = input.required<string[]>();
  parentAttemptId = input.required<string>();
  leftMenuShown = input(true);
  /** Compact (~2/3) cards for TwoLevels grand-children. */
  size = input<'normal' | 'compact'>('normal');
}
