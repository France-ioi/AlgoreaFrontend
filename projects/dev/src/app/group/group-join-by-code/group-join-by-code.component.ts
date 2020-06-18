import { Component, OnInit } from '@angular/core';
import { Group } from '../../shared/models/group.model';
import { GroupService } from '../../shared/services/api/group.service';

export enum CodeState { NotSet, Unused, InUse, Expired }

@Component({
  selector: 'app-group-join-by-code',
  templateUrl: './group-join-by-code.component.html',
  styleUrls: ['./group-join-by-code.component.scss']
})

export class GroupJoinByCodeComponent implements OnInit {

  group = new Group()
  codeState: CodeState
  processing = false

  constructor(
    private groupService: GroupService
  ) { }

  ngOnInit(): void {
    this.groupService.getLatestGroup().subscribe(group => {
      this.group = group;
    });
  }

  /* events */

  changeValidity(newValue: Number) {
    // check valid state
    // disable UI
    // call code refresh service
    // display result
    // refresh group info
    // re-enable UI
    console.log('new value:'+newValue);
  }

  generateCode() {
    console.log('generateCode');
    // check valid state
    // disable UI
    // call code refresh service
    // display result
    // update validity and code
    // re-enable UI
  }

  refreshCode() {
    console.log('refreshCode');
    // check valid state
    // disable UI
    // call code refresh service
    // display result
    // re-enable UI
  }

  removeCode() {
    console.log('removeCode');
    // check valid state
    // disable UI
    // call code removal service
    // display result
    // re-enable UI
  }

}
