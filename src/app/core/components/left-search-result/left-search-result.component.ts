import { Component, EventEmitter, Input, Output } from '@angular/core';
import { SearchResponse } from 'src/app/shared/http-services/search.service';

@Component({
  selector: 'alg-left-search-result',
  templateUrl: './left-search-result.component.html',
  styleUrls: [ './left-search-result.component.scss' ]
})
export class LeftSearchResultComponent {
  @Input() data?: SearchResponse['searchResults'];
  @Output() close = new EventEmitter<void>();
}
