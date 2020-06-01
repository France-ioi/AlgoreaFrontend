import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { ActivatedRoute, UrlSegment } from '@angular/router';
import { Location } from '@angular/common';

export enum TabUrls {
  Overview = 'overview',
  Composition = 'members',
  Administration = 'managers',
  Settings = 'settings'
}

@Component({
  selector: 'app-group-active-tab',
  templateUrl: './group-active-tab.component.html',
  styleUrls: ['./group-active-tab.component.scss']
})
export class GroupActiveTabComponent implements OnInit {

  @Output() activeTabChange = new EventEmitter<number>();

  constructor(
    private activatedRoute: ActivatedRoute,
    private location: Location
  ) { }

  ngOnInit() {
    this.activatedRoute.url.subscribe(_ => {
      const path = this.location.path().split('/').pop();
      switch (path) {
        case TabUrls.Composition:
          this.activeTabChange.emit(1);
          break;
        case TabUrls.Administration:
          this.activeTabChange.emit(2);
          break;
        case TabUrls.Settings:
          this.activeTabChange.emit(3);
          break;
        default:
          this.activeTabChange.emit(0);
          break;
      }
    });
  }

}
