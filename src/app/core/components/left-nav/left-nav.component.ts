import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { distinctUntilChanged, map } from 'rxjs/operators';
import {
  CurrentContentService,
  isActivityInfo,
  isGroupInfo,
  isItemInfo,
  isSkillInfo
} from 'src/app/shared/services/current-content.service';
import { ItemNavigationService } from '../../http-services/item-navigation.service';
import { LeftNavActivityDataSource, LeftNavSkillDataSource } from './left-nav-item-datasource';

const activitiesTabIdx = 0;
const skillsTabIdx = 1;
const groupsTabIdx = 2;

@Component({
  selector: 'alg-left-nav',
  templateUrl: './left-nav.component.html',
  styleUrls: [ './left-nav.component.scss' ]
})
export class LeftNavComponent implements OnInit, OnDestroy {

  activeTabIndex = 0;
  dataSources = [
    new LeftNavActivityDataSource(this.itemNavigationService),
    new LeftNavSkillDataSource(this.itemNavigationService),
    new LeftNavActivityDataSource(this.itemNavigationService) // to be changed
  ];

  private subscription?: Subscription;

  constructor(
    private currentContent: CurrentContentService,
    private itemNavigationService: ItemNavigationService,
  ) { }

  ngOnInit(): void {
    // Follow page change and trigger changes.
    this.subscription = this.currentContent.currentContent$.pipe(
      // we are only interested in items and groups
      map(content => (content !== null && (isItemInfo(content) || isGroupInfo(content)) ? content : undefined)),
      // prevent emitting multiple time 'undefined' as it does not change anything
      distinctUntilChanged((v1, v2) => v1 === undefined && v2 === undefined)

    ).subscribe(content => {
      if (content && isGroupInfo(content)) {
        this.contentTabChange(groupsTabIdx);
        // todo: seed loader

      } else if (content && isSkillInfo(content)) {
        this.contentTabChange(skillsTabIdx);
        this.dataSources[skillsTabIdx].showContent(content);

      } else if (content && isActivityInfo(content)) {
        this.contentTabChange(activitiesTabIdx);
        this.dataSources[activitiesTabIdx].showContent(content);

      } else { // not a group, not an item with a known type
        this.removeAllSelections();
      }
    });
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
  }

  /**
   * If the given tab is the same as the current one, do nothing.
   * Otherwise, remove selection on all tabs and switch tab.
   * (not to be called when manually switching tab)
   */
  private contentTabChange(tabIdx: number): void {
    if (tabIdx !== this.activeTabIndex) {
      this.removeAllSelections();
      this.activeTabIndex = tabIdx;
    }
  }

  private removeAllSelections(): void {
    this.dataSources.forEach(l => l.removeSelection());
  }

  onSelectionChangedByIdx(e: { index: number }): void {
    this.activeTabIndex = e.index;
    this.dataSources[e.index].focus();
  }

}
