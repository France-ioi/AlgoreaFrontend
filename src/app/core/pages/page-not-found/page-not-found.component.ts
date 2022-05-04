import { Component } from '@angular/core';
import { LayoutService } from '../../../shared/services/layout.service';

@Component({
  selector: 'alg-page-not-found',
  templateUrl: './page-not-found.component.html',
  styleUrls: [ './page-not-found.component.scss' ]
})
export class PageNotFoundComponent {
  constructor(
    private layoutService: LayoutService,
  ) {
    this.layoutService.configure({ fullFrameActive: false });
  }
}
