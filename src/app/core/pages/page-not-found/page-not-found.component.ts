import { Component } from '@angular/core';
import { CurrentContentService } from 'src/app/shared/services/current-content.service';

@Component({
  selector: 'alg-page-not-found',
  templateUrl: './page-not-found.component.html',
  styleUrls: [ './page-not-found.component.scss' ]
})
export class PageNotFoundComponent {
  constructor(
    private currentContentService: CurrentContentService,
  ) {
    this.currentContentService.clear();
  }
}
