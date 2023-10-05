import { Component, EventEmitter, Input, OnDestroy, Output, ViewChild } from '@angular/core';
import { SearchResponse } from 'src/app/shared/http-services/search.service';
import { OverlayPanel, OverlayPanelModule } from 'primeng/overlaypanel';
import { canCloseOverlay } from '../../../shared/helpers/overlay';
import { BehaviorSubject, debounceTime, merge } from 'rxjs';
import { distinctUntilChanged, filter, shareReplay } from 'rxjs/operators';
import { RouteUrlPipe } from 'src/app/shared/pipes/routeUrl';
import { RawItemRoutePipe } from 'src/app/shared/pipes/itemRoute';
import { PathSuggestionComponent } from '../../../modules/shared-components/components/path-suggestion/path-suggestion.component';
import { RouterLinkActive, RouterLink } from '@angular/router';
import { MessageInfoComponent } from '../../../modules/shared-components/components/message-info/message-info.component';
import { LeftMenuBackButtonComponent } from '../left-menu-back-button/left-menu-back-button.component';
import { NgIf, NgFor, NgClass, AsyncPipe, I18nPluralPipe } from '@angular/common';

@Component({
  selector: 'alg-left-search-result',
  templateUrl: './left-search-result.component.html',
  styleUrls: [ './left-search-result.component.scss' ],
  standalone: true,
  imports: [
    NgIf,
    LeftMenuBackButtonComponent,
    MessageInfoComponent,
    NgFor,
    RouterLinkActive,
    RouterLink,
    NgClass,
    OverlayPanelModule,
    PathSuggestionComponent,
    AsyncPipe,
    I18nPluralPipe,
    RawItemRoutePipe,
    RouteUrlPipe
  ],
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
