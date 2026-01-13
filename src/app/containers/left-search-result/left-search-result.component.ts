import { Component, EventEmitter, Input, Output, signal } from '@angular/core';
import { SearchResponse } from '../../data-access/search.service';
import { RouteUrlPipe } from 'src/app/pipes/routeUrl';
import { ItemRoutePipe } from 'src/app/pipes/itemRoute';
import { PathSuggestionComponent } from '../path-suggestion/path-suggestion.component';
import { RouterLinkActive, RouterLink } from '@angular/router';
import { MessageInfoComponent } from '../../ui-components/message-info/message-info.component';
import { LeftMenuBackButtonComponent } from '../../ui-components/left-menu-back-button/left-menu-back-button.component';
import { NgClass } from '@angular/common';
import { ShowOverlayDirective } from 'src/app/ui-components/overlay/show-overlay.directive';
import { ShowOverlayHoverTargetDirective } from 'src/app/ui-components/overlay/show-overlay-hover-target.directive';

@Component({
  selector: 'alg-left-search-result',
  templateUrl: './left-search-result.component.html',
  styleUrls: [ './left-search-result.component.scss' ],
  imports: [
    LeftMenuBackButtonComponent,
    MessageInfoComponent,
    RouterLinkActive,
    RouterLink,
    NgClass,
    PathSuggestionComponent,
    ItemRoutePipe,
    RouteUrlPipe,
    ShowOverlayDirective,
    ShowOverlayHoverTargetDirective
  ]
})
export class LeftSearchResultComponent {
  @Input() data?: SearchResponse['searchResults'];
  @Output() close = new EventEmitter<void>();

  itemId = signal<string | undefined>(undefined);
}
