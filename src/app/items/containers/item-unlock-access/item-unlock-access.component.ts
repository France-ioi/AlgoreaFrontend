import { Component, ElementRef, Input, OnChanges, OnDestroy, QueryList, signal, ViewChildren } from '@angular/core';
import { ItemData } from '../../models/item-data';
import { OverlayPanelModule } from 'primeng/overlaypanel';
import { ReplaySubject, Subject, switchMap } from 'rxjs';
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
import { NgIf, NgFor, AsyncPipe } from '@angular/common';
import { ShowOverlayDirective } from 'src/app/ui-components/overlay/show-overlay.directive';
import { ShowOverlayHoverTargetDirective } from 'src/app/ui-components/overlay/show-overlay-hover-target.directive';
import { outputFromObservable } from '@angular/core/rxjs-interop';

@Component({
  selector: 'alg-item-unlock-access',
  templateUrl: './item-unlock-access.component.html',
  styleUrls: [ './item-unlock-access.component.scss' ],
  standalone: true,
  imports: [
    NgIf,
    LoadingComponent,
    ErrorComponent,
    NgFor,
    ScoreRingComponent,
    RouterLink,
    OverlayPanelModule,
    PathSuggestionComponent,
    AsyncPipe,
    ItemRoutePipe,
    RouteUrlPipe,
    ShowOverlayDirective,
    ShowOverlayHoverTargetDirective,
  ],
})
export class ItemUnlockAccessComponent implements OnChanges, OnDestroy {
  @Input() itemData?: ItemData;

  @ViewChildren('contentRef') contentRef?: QueryList<ElementRef<HTMLElement>>;

  private readonly itemId$ = new ReplaySubject<string>(1);
  private readonly refresh$ = new Subject<void>();

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

  constructor(
    private getItemPrerequisitesService: GetItemPrerequisitesService,
  ) {
  }

  ngOnChanges(): void {
    if (this.itemData) {
      this.itemId$.next(this.itemData.item.id);
    }
  }

  ngOnDestroy(): void {
    this.itemId$.complete();
    this.refresh$.complete();
  }

  refresh(): void {
    this.refresh$.next();
  }
}
