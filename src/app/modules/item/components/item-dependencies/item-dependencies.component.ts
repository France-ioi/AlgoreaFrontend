import { Component, ElementRef, Input, OnChanges, OnDestroy, QueryList, ViewChild, ViewChildren } from '@angular/core';
import { GetItemPrerequisitesService } from '../../http-services/get-item-prerequisites.service';
import { BehaviorSubject, debounceTime, merge, ReplaySubject, Subject, switchMap } from 'rxjs';
import { mapToFetchState } from '../../../../shared/operators/state';
import { distinctUntilChanged, filter, map, shareReplay } from 'rxjs/operators';
import { OverlayPanel } from 'primeng/overlaypanel';
import { ItemData } from '../../services/item-datasource.service';

@Component({
  selector: 'alg-item-dependencies',
  templateUrl: './item-dependencies.component.html',
  styleUrls: [ './item-dependencies.component.scss' ],
})
export class ItemDependenciesComponent implements OnChanges, OnDestroy {
  @Input() itemData?: ItemData;

  @ViewChild('op') op?: OverlayPanel;
  @ViewChildren('contentRef') contentRef?: QueryList<ElementRef<HTMLElement>>;

  private readonly itemId$ = new ReplaySubject<string>(1);
  private readonly refresh$ = new Subject<void>();

  state$ = this.itemId$.pipe(
    switchMap(itemId => this.getItemPrerequisitesService.get(itemId)),
    map(items => items.filter(item => item.dependencyGrantContentView)),
    mapToFetchState({ resetter: this.refresh$ }),
  );

  private readonly showOverlaySubject$ = new BehaviorSubject<{ event: Event, itemId: string, target: HTMLElement }|undefined>(undefined);
  showOverlay$ = merge(
    this.showOverlaySubject$.pipe(debounceTime(750)),
    this.showOverlaySubject$.pipe(filter(value => !value)), // this allows to close the overlay immediately and not after debounce delay
  ).pipe(distinctUntilChanged(), shareReplay(1));

  private readonly showOverlaySubscription = this.showOverlay$.subscribe(data => {
    data ? this.op?.toggle(data.event, data.target) : this.op?.hide();
  });

  constructor(private getItemPrerequisitesService: GetItemPrerequisitesService) {
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
    const target = event.target;
    const relatedTarget = event.relatedTarget;
    const keepOverlayOpened = target instanceof HTMLElement &&
      relatedTarget instanceof HTMLElement &&
      !!relatedTarget.closest('.alg-path-suggestion-overlay');

    if (!keepOverlayOpened) {
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
