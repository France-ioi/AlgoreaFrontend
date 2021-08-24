
import { Component, OnDestroy, OnInit, Output, EventEmitter } from '@angular/core';
import { Subscription } from 'rxjs';
import { delay, map, pairwise } from 'rxjs/operators';
import { isGroupInfo } from 'src/app/shared/models/content/group-info';
import { isActivityInfo, isItemInfo } from 'src/app/shared/models/content/item-info';
import { CurrentContentService } from 'src/app/shared/services/current-content.service';
import { UserSessionService } from 'src/app/shared/services/user-session.service';
import { GroupNavigationService } from '../../http-services/group-navigation.service';
import { ItemNavigationService } from '../../http-services/item-navigation.service';
import { LeftNavGroupDataSource } from './left-nav-group-datasource';
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
  @Output() themeChange = new EventEmitter<string | null>();
  @Output() selectId = new EventEmitter<string>();

  activeTabIndex = 0;
  readonly dataSources: [LeftNavActivityDataSource, LeftNavSkillDataSource, LeftNavGroupDataSource] = [
    new LeftNavActivityDataSource(this.itemNavigationService),
    new LeftNavSkillDataSource(this.itemNavigationService),
    new LeftNavGroupDataSource(this.groupNavigationService),
  ];
  currentUser$ = this.sessionService.userProfile$.pipe(delay(0));

  private subscription?: Subscription;

  constructor(
    private sessionService: UserSessionService,
    private currentContent: CurrentContentService,
    private itemNavigationService: ItemNavigationService,
    private groupNavigationService: GroupNavigationService,
  ) { }

  ngOnInit(): void {
    // Follow page change and trigger changes.
    this.subscription = this.currentContent.content$.pipe(
      // we are only interested in items and groups
      map(content => (content !== null && (isItemInfo(content) || isGroupInfo(content)) ? content : undefined)),
      pairwise(),
    ).subscribe(([ prevContent, content ]) => {
      // If the content changed (different id), clear the selection (clear all tabs as we don't really know on which tab was the selection)
      if (prevContent?.type !== content?.type || prevContent?.route.id !== content?.route.id) {
        this.dataSources.forEach(l => l.removeSelection());

        if (content) {
          this.selectId.emit(content.route.id);
        }
      }

      if (!content) { // no tab and no content to select
        this.dataSources[this.activeTabIndex]?.focus(); // if the current tab has not been initialized yet, do it now

      } else if (isGroupInfo(content)) {
        this.changeTab(groupsTabIdx);
        this.dataSources[groupsTabIdx].showContent(content);

      } else if (isActivityInfo(content)) {
        this.changeTab(activitiesTabIdx);
        this.dataSources[activitiesTabIdx].showContent(content);

      } else {
        this.changeTab(skillsTabIdx);
        this.dataSources[skillsTabIdx].showContent(content);
      }
    });
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
  }

  onSelectionChangedByIdx(e: { index: number }): void {
    this.changeTab(e.index);
  }

  changeTab(index: number): void {
    this.activeTabIndex = index;
    this.dataSources[index]?.focus();
    this.themeChange.emit(this.activeTabIndex === 2 ? 'dark' : null);
  }

  retryError(): void {
    this.dataSources[this.activeTabIndex]?.retry();
  }

}
