import { Component, ElementRef, Input, OnChanges, OnDestroy, QueryList, ViewChild, ViewChildren } from '@angular/core';
import { ItemData } from '../../services/item-datasource.service';
import { OverlayPanel, OverlayPanelModule } from 'primeng/overlaypanel';
import { BehaviorSubject, debounceTime, merge, ReplaySubject, Subject, switchMap } from 'rxjs';
import { distinctUntilChanged, filter, map, share, shareReplay } from 'rxjs/operators';
import { mapToFetchState } from 'src/app/utils/operators/state';
import { GetItemPrerequisitesService } from '../../data-access/get-item-prerequisites.service';
import { canCloseOverlay } from 'src/app/utils/overlay';
import { canCurrentUserViewContent } from 'src/app/items/models/item-view-permission';
import { RouteUrlPipe } from 'src/app/pipes/routeUrl';
import { ItemRoutePipe } from 'src/app/pipes/itemRoute';
import { PathSuggestionComponent } from 'src/app/containers/path-suggestion/path-suggestion.component';
import { RouterLink } from '@angular/router';
import { ScoreRingComponent } from 'src/app/ui-components/score-ring/score-ring.component';
import { SectionComponent } from 'src/app/ui-components/section/section.component';
import { ErrorComponent } from 'src/app/ui-components/error/error.component';
import { LoadingComponent } from 'src/app/ui-components/loading/loading.component';
import { NgIf, NgFor, AsyncPipe } from '@angular/common';

@Component({
  selector: 'alg-item-unlock-access',
  templateUrl: './item-unlock-access.component.html',
  styleUrls: [ './item-unlock-access.component.scss' ],
  standalone: true,
  imports: [
    NgIf,
    LoadingComponent,
    ErrorComponent,
    SectionComponent,
    NgFor,
    ScoreRingComponent,
    RouterLink,
    OverlayPanelModule,
    PathSuggestionComponent,
    AsyncPipe,
    ItemRoutePipe,
    RouteUrlPipe,
  ],
})
export class ItemUnlockAccessComponent implements OnChanges, OnDestroy {
  @Input() itemData?: ItemData;

  @ViewChild('op') op?: OverlayPanel;
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
  private readonly showOverlaySubject$ = new BehaviorSubject<{ event: Event, itemId: string, target: HTMLElement }|undefined>(undefined);
  showOverlay$ = merge(
    this.showOverlaySubject$.pipe(debounceTime(750)),
    this.showOverlaySubject$.pipe(filter(value => !value)), // this allows to close the overlay immediately and not after debounce delay
  ).pipe(distinctUntilChanged(), shareReplay(1));

  private readonly showOverlaySubscription = this.showOverlay$.subscribe(data => {
    data ? this.op?.toggle(data.event, data.target) : this.op?.hide();
  });

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
    this.showOverlaySubject$.complete();
    this.refresh$.complete();
    this.showOverlaySubscription.unsubscribe();
  }

  onMouseEnter(event: Event, itemId: string, index: number): void {
    const targetRef = this.contentRef?.get(index);
    if (!targetRef) {
      throw new Error('Unexpected: Target is not found');
    }
    this.showOverlaySubject$.next({ event, itemId, target: targetRef.nativeElement });
  }

  onMouseLeave(event: MouseEvent): void {
    if (canCloseOverlay(event)) {
      this.closeOverlay();
    }
  }

  closeOverlay(): void {
    this.showOverlaySubject$.next(undefined);
  }

  refresh(): void {
    this.refresh$.next();
  }
}
