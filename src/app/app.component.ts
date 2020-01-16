import { Component } from '@angular/core';
import { PickListType, PickListColor } from './pick-list/pick-list.component';
import { ProgressType } from './skill-progress/skill-progress.component';
import { NodeService } from './services/node-service.service';
import * as _ from 'lodash';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  ProgressType = ProgressType;
  title = 'france-ioi';
  list = {
    lists: [
      {
        ID: PickListType.Standard,
        title: "Select columns to import",
        color: PickListColor.Standard
      },
      {
        ID: PickListType.Imported,
        title: "Imported columns",
        color: PickListColor.Imported
      }
    ],
    items: [
      { ID: 1, title: "Last name", list: PickListType.Standard },
      { ID: 2, title: "Grade", list: PickListType.Standard },
      { ID: 3, title: "Sub-group", list: PickListType.Standard },
      { ID: 4, title: "First name", list: PickListType.Imported },
    ]
  };
  list1 = {
    lists: [
      {
        ID: PickListType.NonRequested,
        title: "Non-requested fields",
        color: PickListColor.NonRequested
      },
      {
        ID: PickListType.Standard,
        title: "Recommended fields",
        color: PickListColor.Standard
      },
      {
        ID: PickListType.Mandatory,
        title: "Mandatory fields",
        color: PickListColor.Mandatory
      },
    ],
    items: [
      { ID: 1, title: "Online", list: PickListType.NonRequested },
      { ID: 2, title: "Change Password", list: PickListType.NonRequested },
      { ID: 3, title: "E-mail", list: PickListType.Standard },
      { ID: 4, title: "Member's activity", list: PickListType.Standard },
      { ID: 5, title: "Skills", list: PickListType.Standard },
      { ID: 6, title: "Participation code", list: PickListType.Standard },
      { ID: 7, title: "First name", list: PickListType.Mandatory },
      { ID: 8, title: "Last name", list: PickListType.Mandatory },
      { ID: 9, title: "Login", list: PickListType.Mandatory },
    ]
  };
  curScore = 70;
  dispScore = 65;
  isStarted = true;

  // Tree Data

  files;
  groups;
  trees;

  constructor(private nodeService: NodeService) {}

  ngOnInit() {
    this.nodeService.getFiles().then(res => {
      this.files = res;
      this.groups = _.cloneDeep(res);
    });
    this.nodeService.getTrees().then(res => {
      this.trees = res;
    });
  }

  onDisplayScoreChange(e) {
    this.dispScore = e.srcElement.valueAsNumber;
  }

  onCurrentScoreChange(e) {
    this.curScore = e.srcElement.valueAsNumber;
  }

  onIsStartedChange(e) {
    this.isStarted = e.srcElement.checked;
  }
}
