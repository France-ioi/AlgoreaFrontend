import { Component, DestroyRef, inject, input, signal } from '@angular/core';
import { outputFromObservable, toObservable } from '@angular/core/rxjs-interop';
import { ItemData } from '../../models/item-data';
import { Subject, switchMap } from 'rxjs';
import { map, share } from 'rxjs/operators';
import { mapToFetchState, readyData } from 'src/app/utils/operators/state';
import { GetItemPrerequisitesService } from '../../data-access/get-item-prerequisites.service';
import { canCurrentUserViewContent } from 'src/app/items/models/item-view-permission';
import { RouteUrlPipe } from 'src/app/pipes/routeUrl';
import { ItemRoutePipe } from 'src/app/pipes/itemRoute';
import { PathSuggestionComponent } from 'src/app/containers/path-suggestion/path-suggestion.component';
import { RouterLink } from '@angular/router';
import { ScoreRingComponent } from 'src/app/ui-components/score-ring/score-ring.component';
import { ErrorComponent } from 'src/app/ui-components/error/error.component';
import { LoadingComponent } from 'src/app/ui-components/loading/loading.component';
import { AsyncPipe } from '@angular/common';
import { ShowOverlayDirective } from 'src/app/ui-components/overlay/show-overlay.directive';
import { ShowOverlayHoverTargetDirective } from 'src/app/ui-components/overlay/show-overlay-hover-target.directive';

@Component({
  selector: 'alg-item-unlock-access',
  templateUrl: './item-unlock-access.component.html',
  styleUrl: './item-unlock-access.component.scss',
  imports: [
    LoadingComponent,
    ErrorComponent,
    ScoreRingComponent,
    RouterLink,
    PathSuggestionComponent,
    AsyncPipe,
    ItemRoutePipe,
    RouteUrlPipe,
    ShowOverlayDirective,
    ShowOverlayHoverTargetDirective,
  ]
})
export class ItemUnlockAccessComponent {
  private getItemPrerequisitesService = inject(GetItemPrerequisitesService);

  readonly itemData = input.required<ItemData>();

  private readonly refresh$ = new Subject<void>();

  constructor() {
    inject(DestroyRef).onDestroy(() => this.refresh$.complete());
  }

  private readonly itemId$ = toObservable(this.itemData).pipe(
    map(itemData => itemData.item.id),
  );

  state$ = this.itemId$.pipe(
    switchMap(itemId => this.getItemPrerequisitesService.get(itemId)),
    map(data => data.map(item => ({
      ...item,
      isLocked: !canCurrentUserViewContent(item),
    }))),
    mapToFetchState({ resetter: this.refresh$ }),
    share(),
  );

  hasContent = outputFromObservable(this.state$.pipe(
    readyData(),
    map(data => data.length > 0),
  ));

  itemId = signal<string | undefined>(undefined);

  refresh(): void {
    this.refresh$.next();
  }
}
