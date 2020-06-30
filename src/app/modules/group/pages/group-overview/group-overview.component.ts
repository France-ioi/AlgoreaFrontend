import { Component } from '@angular/core';
import { GroupTabService } from '../../services/group-tab.service';
import { Group } from '../../http-services/get-group-by-id.service';

@Component({
  selector: 'alg-group-overview',
  templateUrl: './group-overview.component.html',
  styleUrls: ['./group-overview.component.scss']
})
export class GroupOverviewComponent {

  group: Group

  constructor(
    private groupTabService: GroupTabService,
  ) {
    this.groupTabService.group$.subscribe((g: Group) => {
      this.group = g;
    });
  }

}
