import { Component } from '@angular/core';
import { GroupTabService } from '../../services/group-tab.service';

@Component({
  selector: 'alg-group-overview',
  templateUrl: './group-overview.component.html',
  styleUrls: ['./group-overview.component.scss']
})
export class GroupOverviewComponent {

  group$ = this.groupTabService.group$;

  constructor(
    private groupTabService: GroupTabService,
  ) {}

}
