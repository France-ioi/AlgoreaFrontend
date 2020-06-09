import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { v4 as uuid } from 'uuid';

export enum PickListType {
  Standard,
  Imported,
  NonRequested,
  Mandatory,
}

export enum PickListColor {
  Standard = '#4A90E2',
  Imported = '#F5A623',
  NonRequested = '#9B9B9B',
  Mandatory = '#FF001F',
}

export enum PickListItemType {
  Normal = 'normal',
  Lock = 'lock',
}

@Component({
  selector: 'lib-pick-list',
  templateUrl: './pick-list.component.html',
  styleUrls: ['./pick-list.component.scss'],
})
export class PickListComponent implements OnInit {
  @Input() listCount = 2;
  @Input() list;

  @Output() onLock = new EventEmitter<any>();
  @Output() onShowDate = new EventEmitter<any>();

  selectedID = -1;
  activeID = -1;
  activeType = -1;

  constructor() {}

  ngOnInit() {
    this.list._id = uuid();
    this.list.lists.map((listItem) => {
      switch (listItem.ID) {
        case PickListType.Imported:
          listItem.border = 'dashed .1rem #6F90B6';
          break;
        default:
          listItem.border = 'dashed .1rem #E4E4E4';
          break;
      }

      return listItem;
    });
  }

  onItemDrop(e, listItem) {
    // Check if the item is from other pick list

    if (e.dragData._id !== this.list._id) {
      return;
    }

    if (e.dragData.data.type === PickListItemType.Lock) {
      if (listItem.ID === PickListType.Standard) {
        this.onLock.emit(true);
        return;
      } else {
        this.onShowDate.emit(listItem.ID === PickListType.Mandatory);
      }
    }

    this.onLock.emit(false);
    e.dragData.data.list = listItem.ID;
  }

  onListItemSelect(_e, item, _listID) {
    this.activeID = item.ID;
    this.activeType = item.list;
  }

  onKeyDown(e) {
    if (
      e.code !== 'ArrowLeft' &&
      e.code !== 'ArrowRight' &&
      e.code !== 'ArrowUp' &&
      e.code !== 'ArrowDown' &&
      e.code !== 'Space'
    ) {
      return;
    }
    e.preventDefault();
    e.stopPropagation();
    if (this.activeID === -1) {
      // this.list.items.filter(item => {
      //   return item.list === this.list.lists[0].ID;
      // });
    } else {
      if (e.code === 'ArrowLeft' || e.code === 'ArrowRight') {
        let ord = 0;
        for (let i = 0; i < this.list.lists.length; i++) {
          if (this.list.lists[i].ID === this.activeType) {
            ord = i;
            break;
          }
        }

        if (e.code === 'ArrowLeft') {
          ord = (ord - 1 + this.list.lists.length) % this.list.lists.length;
        } else {
          ord = (ord + 1) % this.list.lists.length;
        }

        if (this.selectedID < 0) {
          const selList = this.list.items.filter((item) => {
            return item.list === this.list.lists[ord].ID;
          });

          if (selList.length > 0) {
            this.activeID = selList[0].ID;
            this.activeType = this.list.lists[ord].ID;
          }
        } else {
          for (const item of this.list.items) {
            if (item.ID === this.selectedID) {
              if (
                item.type === PickListItemType.Lock &&
                this.list.lists[ord].ID === PickListType.Standard
              ) {
                this.onLock.emit(true);
                return;
              }
              item.list = this.list.lists[ord].ID;
              this.activeType = item.list;
              this.activeID = this.selectedID;
              break;
            }
          }
        }
      } else if (e.code === 'ArrowUp' || e.code === 'ArrowDown') {
        if (this.selectedID < 0) {
          const selList = this.list.items.filter((item) => {
            return item.list === this.activeType;
          });
          let ord = 0;
          for (let i = 0; i < selList.length; i++) {
            if (selList[i].ID === this.activeID) {
              ord = i;
              break;
            }
          }

          if (e.code === 'ArrowUp') {
            ord = (ord - 1 + selList.length) % selList.length;
          } else {
            ord = (ord + 1) % selList.length;
          }

          this.activeID = selList[ord].ID;
        } else {
        }
      } else {
        if (this.selectedID < 0) {
          this.selectedID = this.activeID;
        } else {
          this.selectedID = -1;
        }
      }
    }
  }

  onClickOutside(_e) {
    this.activeID = -1;
  }
}
