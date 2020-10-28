import { Component, OnInit } from '@angular/core';
import { CurrentContentService } from '../../../../shared/services/current-content.service';

@Component({
  selector: 'alg-joined-groups',
  templateUrl: './joined-groups.component.html',
  styleUrls: ['./joined-groups.component.scss']
})
export class JoinedGroupsComponent implements OnInit {
  title = 'Joined Groups'
  subtitle = 'Joined groups works !'

  constructor(private currentContent: CurrentContentService) { }

  ngOnInit(): void {
    this.currentContent.setCurrent({ // change to current.next(content) when merging with master
      type: 'group',
      breadcrumbs: {
        category: this.title,
        path: [],
        currentPageIdx: -1,
      },
      title: this.title,
    });
  }

}
