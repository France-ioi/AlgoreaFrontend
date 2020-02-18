import { Component, OnInit, Input } from '@angular/core';
import { v4 as uuid } from 'uuid';

export enum PickListType {
  Standard,
  Imported,
  NonRequested,
  Mandatory
}

export enum PickListColor {
  Standard = "#4A90E2",
  Imported = "#F5A623",
  NonRequested = "#9B9B9B",
  Mandatory = "#FF001F"
}

@Component({
  selector: 'app-pick-list',
  templateUrl: './pick-list.component.html',
  styleUrls: ['./pick-list.component.scss']
})
export class PickListComponent implements OnInit {

  @Input() listCount = 2;
  @Input() list = {
    lists: [],
    items: []
  };

  constructor() { 
  }

  ngOnInit() {
    this.list["_id"] = uuid();
    this.list.lists.map(listItem => {
      switch(listItem.ID) {
        case PickListType.Imported:
          listItem.border = "dashed 1px #6F90B6";
          break;
        default:
          listItem.border = "dashed 1px #E4E4E4";
          break;
      }

      return listItem;
    });
  }

  onItemDrop(e, listItem) {

    // Check if the item is from other pick list

    if (e.dragData._id !== this.list["_id"]) {
      return;
    }
    
    e.dragData.data.list = listItem.ID;
  }

}
