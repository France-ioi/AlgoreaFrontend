import { Component, OnInit } from '@angular/core';
import { NodeService } from 'src/app/services/node-service.service';
import { PickListType, PickListColor, PickListItemType } from 'projects/core/src/public-api';

@Component({
  selector: 'app-group-settings',
  templateUrl: './group-settings.component.html',
  styleUrls: ['./group-settings.component.scss']
})
export class GroupSettingsComponent implements OnInit {

  trees;
  
  pickListData = {
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
      }
    ],
    items: [
      { ID: 1, title: "Online", list: PickListType.NonRequested, type: PickListItemType.Normal },
      { ID: 2, title: "Change Password", list: PickListType.NonRequested, type: PickListItemType.Normal },
      { ID: 3, title: "E-mail", list: PickListType.Standard, type: PickListItemType.Normal },
      { ID: 4, title: "Member's activity", list: PickListType.Standard, type: PickListItemType.Normal },
      { ID: 5, title: "Skills", list: PickListType.Standard, type: PickListItemType.Normal },
      { ID: 6, title: "Participation code", list: PickListType.Standard, type: PickListItemType.Normal },
      { ID: 7, title: "First name", list: PickListType.Mandatory, type: PickListItemType.Normal },
      { ID: 8, title: "Last name", list: PickListType.Mandatory, type: PickListItemType.Normal },
      { ID: 9, title: "Login", list: PickListType.Mandatory, type: PickListItemType.Normal },
      { ID: 10, title: "Locked into Group", list: PickListType.Mandatory, type: PickListItemType.Lock }
    ]
  };

  memberPickListData = {
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
      }
    ],
    items: [
      { ID: 1, title: "Online", list: PickListType.NonRequested, type: PickListItemType.Normal },
      { ID: 2, title: "Change Password", list: PickListType.NonRequested, type: PickListItemType.Normal },
      { ID: 3, title: "E-mail", list: PickListType.Standard, type: PickListItemType.Normal },
      { ID: 6, title: "Discussions", list: PickListType.Standard, type: PickListItemType.Normal },
      { ID: 7, title: "First name", list: PickListType.Standard, type: PickListItemType.Normal },
      { ID: 8, title: "Last name", list: PickListType.Standard, type: PickListItemType.Normal },
      { ID: 9, title: "Login", list: PickListType.Mandatory, type: PickListItemType.Normal }
    ]
  };

  showPickListError = false;
  showLockDate = true;

  constructor(
    private nodeService: NodeService
  ) { }

  ngOnInit() {
    this.nodeService.getFiles().then(res => {
      this.trees = res;
    })
  }

  onLockDrop(e) {
    this.showPickListError = e;
  }

  onShowDateEvent(e) {
    this.showLockDate = e;
  }

}
