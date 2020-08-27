import { Component, OnInit } from '@angular/core';
import { CurrentContentService } from 'src/app/shared/services/current-content.service';
import { ActivatedRoute } from '@angular/router';
import { itemFromDetailParams } from 'src/app/shared/services/nav-types';

@Component({
  selector: 'alg-item-details',
  templateUrl: './item-details.component.html',
  styleUrls: ['./item-details.component.scss']
})
export class ItemDetailsComponent implements OnInit {

  constructor(
    private activatedRoute: ActivatedRoute,
    private currentContent: CurrentContentService,
  ) {
    activatedRoute.paramMap.subscribe((params) => {
      const item = itemFromDetailParams(params);
      currentContent.setCurrent(item);
    });
  }

  ngOnInit() {
  }

}
