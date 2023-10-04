import { Component } from '@angular/core';
import { CurrentContentService } from 'src/app/shared/services/current-content.service';
import { ErrorComponent } from '../../../modules/shared-components/components/error/error.component';
import { FullHeightContentDirective } from '../../../shared/directives/full-height-content.directive';

@Component({
  selector: 'alg-page-not-found',
  templateUrl: './page-not-found.component.html',
  styleUrls: [ './page-not-found.component.scss' ],
  standalone: true,
  imports: [ FullHeightContentDirective, ErrorComponent ]
})
export class PageNotFoundComponent {
  constructor(
    private currentContentService: CurrentContentService,
  ) {
    this.currentContentService.clear();
  }
}
