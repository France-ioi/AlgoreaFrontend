import { Component } from '@angular/core';
import { GroupTabService } from '../../services/group-tab.service';
import { Group } from '../../http-services/get-group-by-id.service';

@Component({
  selector: 'alg-group-composition',
  templateUrl: './group-composition.component.html',
  styleUrls: ['./group-composition.component.scss']
})
export class GroupCompositionComponent {

  group: Group

  constructor(
    private groupTabService: GroupTabService,
  ) {
    this.groupTabService.group$.subscribe((g: Group) => {
      this.group = g;
    });
  }

  refreshGroupInfo() {
    this.groupTabService.refresh$.next();
  }

}
