import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { distinctUntilChanged, map } from 'rxjs/operators';
import { isASkill } from 'src/app/shared/helpers/item-type';
import { CurrentContentService, isGroupInfo, isItemInfo } from 'src/app/shared/services/current-content.service';
import { ItemNavigationService } from '../../http-services/item-navigation.service';
import { LeftNavTab } from '../../services/left-nav-loading/common';
import { LeftNavItemLoader } from '../../services/left-nav-loading/item-loader';

const tabs: LeftNavTab[] = [ 'activities', 'skills', 'groups' ];

@Component({
  selector: 'alg-left-nav',
  templateUrl: './left-nav.component.html',
  styleUrls: [ './left-nav.component.scss' ]
})
export class LeftNavComponent implements OnInit, OnDestroy {

  currentTab: LeftNavTab = 'activities';

  activitiesLoader = new LeftNavItemLoader('activity', this.itemNavigationService)
  skillsLoader = new LeftNavItemLoader('skill', this.itemNavigationService)

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
        this.contentTabChange('groups');
        // todo: seed loader

      } else if (content && isItemInfo(content) && content.data.details) {

        if (isASkill(content.data.details)) {
          this.contentTabChange('skills');
          this.skillsLoader.showContent(content);

        } else { // activity
          this.contentTabChange('activities');
          this.activitiesLoader.showContent(content);
        }

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
  private contentTabChange(tab: LeftNavTab): void {
    if (tab !== this.currentTab) {
      this.removeAllSelections();
      this.currentTab = tab;
    }
  }

  private removeAllSelections(): void {
    this.activitiesLoader.removeSelection();
    this.skillsLoader.removeSelection();
    // todo: add group loader
  }

  onSelectionChangedByIdx(e: { index: number }): void {
    this.currentTab = tabs[e.index];
    const loader = [ this.activitiesLoader, this.skillsLoader, this.activitiesLoader ][e.index];
    loader.focus();
  }

}
