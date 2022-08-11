
import { Component, Output } from '@angular/core';
import { merge, Subject } from 'rxjs';
import { delay, distinctUntilChanged, filter, map, startWith } from 'rxjs/operators';
import { isDefined } from 'src/app/shared/helpers/null-undefined-predicates';
import { ContentInfo } from 'src/app/shared/models/content/content-info';
import { isGroupInfo, isMyGroupsInfo } from 'src/app/shared/models/content/group-info';
import { isActivityInfo, isItemInfo } from 'src/app/shared/models/content/item-info';
import { CurrentContentService } from 'src/app/shared/services/current-content.service';
import { UserSessionService } from 'src/app/shared/services/user-session.service';
import { GroupNavTreeService } from '../../services/navigation/group-nav-tree.service';
import { ActivityNavTreeService, SkillNavTreeService } from '../../services/navigation/item-nav-tree.service';
import { environment } from '../../../../environments/environment';

const activitiesTabIdx = 0;
const skillsTabIdx = 1;
const groupsTabIdx = 2;

@Component({
  selector: 'alg-left-nav',
  templateUrl: './left-nav.component.html',
  styleUrls: [ './left-nav.component.scss' ]
})
export class LeftNavComponent {

  private manualTabChange = new Subject<number>();
  activeTab$ = merge(
    this.manualTabChange,
    this.currentContent.content$.pipe(
      distinctUntilChanged((x,y) => x?.type === y?.type && x?.route?.id === y?.route?.id), // do not re-emit several time for a same content
      map(content => contentToTabIndex(content)),
      filter(isDefined),
    )
  ).pipe(
    startWith(0),
    distinctUntilChanged(),
    map(idx => ({ index: idx })), // using object so that Angular ngIf does not ignore the "0" index
  );

  @Output() themeChange = this.activeTab$.pipe(map(tab => ({ isDark: tab.index === groupsTabIdx })), delay(0));

  readonly navTreeServices = [ this.activityNavTreeService, this.skillNavTreeService, this.groupNavTreeService ];
  currentUser$ = this.sessionService.userProfile$.pipe(delay(0));

  skillsDisabled = environment.featureFlags.skillsDisabled;

  constructor(
    private sessionService: UserSessionService,
    private currentContent: CurrentContentService,
    private activityNavTreeService: ActivityNavTreeService,
    private skillNavTreeService: SkillNavTreeService,
    private groupNavTreeService: GroupNavTreeService,
  ) { }

  onSelectionChangedByIdx(e: { index: number }): void {
    this.manualTabChange.next(e.index);
  }

  retryError(tabIndex: number): void {
    this.navTreeServices[tabIndex]?.retry();
  }

}

function contentToTabIndex(content: ContentInfo|null): number|undefined {
  if (content === null) return undefined;
  if (isGroupInfo(content) || isMyGroupsInfo(content)) return groupsTabIdx;
  if (isItemInfo(content)) {
    return isActivityInfo(content) ? activitiesTabIdx : skillsTabIdx;
  }
  return undefined;
}
