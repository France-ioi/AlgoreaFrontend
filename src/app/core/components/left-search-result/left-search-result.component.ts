import { Component, EventEmitter, Input, OnDestroy, Output, ViewChild } from '@angular/core';
import { SearchResponse } from 'src/app/shared/http-services/search.service';
import { OverlayPanel } from 'primeng/overlaypanel';
import { canCloseOverlay } from '../../../shared/helpers/overlay';
import { BehaviorSubject, debounceTime, merge } from 'rxjs';
import { distinctUntilChanged, filter, shareReplay } from 'rxjs/operators';

@Component({
  selector: 'alg-left-search-result',
  templateUrl: './left-search-result.component.html',
  styleUrls: [ './left-search-result.component.scss' ]
})
export class LeftSearchResultComponent implements OnDestroy {
  @ViewChild('op') op?: OverlayPanel;
  @Input() data?: SearchResponse['searchResults'];
  @Output() close = new EventEmitter<void>();

  private readonly showOverlaySubject$ = new BehaviorSubject<{ event: Event, itemId: string, target: HTMLElement }|undefined>(undefined);
  showOverlay$ = merge(
    this.showOverlaySubject$.pipe(debounceTime(750)),
    this.showOverlaySubject$.pipe(filter(value => !value)), // this allows to close the overlay immediately and not after debounce delay
  ).pipe(distinctUntilChanged(), shareReplay(1));

  private readonly showOverlaySubscription = this.showOverlay$.subscribe(data => {
    data ? this.op?.toggle(data.event, data.target) : this.op?.hide();
  });

  ngOnDestroy(): void {
    this.showOverlaySubject$.complete();
    this.showOverlaySubscription.unsubscribe();
  }

  onMouseEnter(event: Event, itemId: string, targetElement: HTMLElement): void {
    this.showOverlaySubject$.next({ event, itemId, target: targetElement });
  }

  onMouseLeave(event: MouseEvent): void {
    if (canCloseOverlay(event)) {
      this.closeOverlay();
    }
  }

  closeOverlay(): void {
    this.showOverlaySubject$.next(undefined);
  }
}
