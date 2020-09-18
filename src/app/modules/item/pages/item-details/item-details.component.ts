import { Component, OnDestroy, OnInit } from '@angular/core';
import { CurrentContentService } from 'src/app/shared/services/current-content.service';
import { ActivatedRoute } from '@angular/router';
import { itemFromDetailParams } from 'src/app/shared/services/nav-types';

@Component({
  selector: 'alg-item-details',
  templateUrl: './item-details.component.html',
  styleUrls: ['./item-details.component.scss']
})
export class ItemDetailsComponent implements OnInit, OnDestroy {

  constructor(
    private activatedRoute: ActivatedRoute,
    private currentContent: CurrentContentService,
  ) {
    activatedRoute.paramMap.subscribe((params) => {
      const item = itemFromDetailParams(params);
      if (item) currentContent.setCurrent(item);
    });
  }

  ngOnInit() {
    this.currentContent.setPageInfo({
      category: 'Items',
      breadcrumb: [
        { title: 'RootChapter' },
        { title: 'MyChapter', attemptOrder: 1 },
        { title: 'Content' }
      ],
      currentPageIndex: 2
    });
  }

  ngOnDestroy() {
    this.currentContent.setPageInfo(null);
  }

}
