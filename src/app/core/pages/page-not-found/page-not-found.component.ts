import { Component } from '@angular/core';
import { CurrentContentService } from 'src/app/shared/services/current-content.service';
import { LayoutService } from '../../../shared/services/layout.service';

@Component({
  selector: 'alg-page-not-found',
  templateUrl: './page-not-found.component.html',
  styleUrls: [ './page-not-found.component.scss' ]
})
export class PageNotFoundComponent {
  constructor(
    private layoutService: LayoutService,
    private currentContentService: CurrentContentService,
  ) {
    this.layoutService.configure({ fullFrameActive: false });
    this.currentContentService.clear();
  }
}
