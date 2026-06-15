import { Component, input, signal } from '@angular/core';
import { SearchResponse } from '../../data-access/search.service';
import { RouteUrlPipe } from 'src/app/pipes/routeUrl';
import { ItemRoutePipe } from 'src/app/pipes/itemRoute';
import { PathSuggestionComponent } from '../path-suggestion/path-suggestion.component';
import { RouterLinkActive, RouterLink } from '@angular/router';
import { MessageInfoComponent } from '../../ui-components/message-info/message-info.component';
import { ShowOverlayDirective } from 'src/app/ui-components/overlay/show-overlay.directive';
import { ShowOverlayHoverTargetDirective } from 'src/app/ui-components/overlay/show-overlay-hover-target.directive';

@Component({
  selector: 'alg-left-search-result',
  templateUrl: './left-search-result.component.html',
  styleUrls: [ './left-search-result.component.scss' ],
  imports: [
    MessageInfoComponent,
    RouterLinkActive,
    RouterLink,
    PathSuggestionComponent,
    ItemRoutePipe,
    RouteUrlPipe,
    ShowOverlayDirective,
    ShowOverlayHoverTargetDirective,
  ],
})
export class LeftSearchResultComponent {
  // Parent always binds [data]; undefined value means search has not run yet.
  data = input.required<SearchResponse['searchResults'] | undefined>();

  itemId = signal<string | undefined>(undefined);
}
