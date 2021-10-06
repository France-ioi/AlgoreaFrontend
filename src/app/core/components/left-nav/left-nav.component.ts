
import { Component, OnDestroy, OnInit, Output, EventEmitter } from '@angular/core';
import { Subscription } from 'rxjs';
import { delay, distinct, filter, map } from 'rxjs/operators';
import { RoutedContentInfo } from 'src/app/shared/models/content/content-info';
import { isGroupInfo } from 'src/app/shared/models/content/group-info';
import { isActivityInfo, isItemInfo } from 'src/app/shared/models/content/item-info';
import { CurrentContentService } from 'src/app/shared/services/current-content.service';
import { UserSessionService } from 'src/app/shared/services/user-session.service';
import { GroupNavTreeService } from '../../services/navigation/group-nav-tree.service';
import { ActivityNavTreeService, SkillNavTreeService } from '../../services/navigation/item-nav-tree.service';

const activitiesTabIdx = 0;
const skillsTabIdx = 1;
const groupsTabIdx = 2;

@Component({
  selector: 'alg-left-nav',
  templateUrl: './left-nav.component.html',
  styleUrls: [ './left-nav.component.scss' ]
})
export class LeftNavComponent implements OnInit, OnDestroy {
  @Output() themeChange = new EventEmitter<string | null>(true /* async */);
  @Output() selectId = this.currentContent.content$.pipe(
    filter((content): content is RoutedContentInfo => !!content?.route),
    map(content => content.route.id),
    distinct(), // only emit 1x a change of id
  );

  activeTabIndex = 0;
  readonly navTreeServices: [ActivityNavTreeService, SkillNavTreeService, GroupNavTreeService] =
    [ this.activityNavTreeService, this.skillNavTreeService, this.groupNavTreeService ];
  currentUser$ = this.sessionService.userProfile$.pipe(delay(0));

  private subscription?: Subscription;

  constructor(
    private sessionService: UserSessionService,
    private currentContent: CurrentContentService,
    private activityNavTreeService: ActivityNavTreeService,
    private skillNavTreeService: SkillNavTreeService,
    private groupNavTreeService: GroupNavTreeService,
  ) { }

  ngOnInit(): void {
    // Follow page change and trigger changes.
    this.subscription = this.currentContent.content$.pipe(
      // we are only interested in items and groups
      map(content => (content !== null && (isItemInfo(content) || isGroupInfo(content)) ? content : undefined)),
    ).subscribe(content => {
      if (!content) return;
      if (isGroupInfo(content)) {
        this.changeTab(groupsTabIdx);
      } else if (isItemInfo(content)) {
        if (isActivityInfo(content)) this.changeTab(activitiesTabIdx);
        else this.changeTab(skillsTabIdx);
      }
    });
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
  }

  onSelectionChangedByIdx(e: { index: number }): void {
    this.changeTab(e.index);
  }

  private changeTab(index: number): void {
    this.activeTabIndex = index;
    this.themeChange.emit(this.activeTabIndex === 2 ? 'dark' : null);
  }

  retryError(): void {
    this.navTreeServices[this.activeTabIndex]?.retry();
  }

}
