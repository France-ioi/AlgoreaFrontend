import { Component } from '@angular/core';
import { CurrentContentService } from 'src/app/services/current-content.service';
import { ErrorComponent } from 'src/app/ui-components/error/error.component';
import { FullHeightContentDirective } from 'src/app/directives/full-height-content.directive';

@Component({
  selector: 'alg-page-not-found',
  templateUrl: './page-not-found.component.html',
  styleUrls: [ './page-not-found.component.scss' ],
  imports: [ FullHeightContentDirective, ErrorComponent ]
})
export class PageNotFoundComponent {
  constructor(
    private currentContentService: CurrentContentService,
  ) {
    this.currentContentService.clear();
  }
}
