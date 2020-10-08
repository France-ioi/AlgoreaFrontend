import { Component, OnDestroy } from '@angular/core';
import { CurrentContentService } from 'src/app/shared/services/current-content.service';

const YourselfBreadcrumbCat = 'Yourself';

@Component({
  selector: 'alg-yourself',
  templateUrl: './yourself.component.html',
  styleUrls: ['./yourself.component.scss'],
})
export class YourselfComponent implements OnDestroy {

  constructor(
    private currentContent: CurrentContentService,
  ) {
    currentContent.setCurrent(
      {
        type: 'Yourself', breadcrumbs: {category: YourselfBreadcrumbCat, path: [], currentPageIdx: 0}
      }
    );

  }

  ngOnDestroy() {
    this.currentContent.setCurrent(null);
  }

}
