import { Component, OnInit } from '@angular/core';
import { contentInfo } from 'src/app/shared/models/content/content-info';
import { CurrentContentService } from '../../../../shared/services/current-content.service';

@Component({
  selector: 'alg-joined-groups',
  templateUrl: './joined-groups.component.html',
  styleUrls: [ './joined-groups.component.scss' ]
})
export class JoinedGroupsComponent implements OnInit {

  constructor(private currentContent: CurrentContentService) { }

  ngOnInit(): void {
    this.currentContent.current.next(contentInfo({
      breadcrumbs: {
        category: $localize`Joined Groups`,
        path: [],
        currentPageIdx: -1,
      },
      title: $localize`Joined Groups`,
    }));
  }

}
