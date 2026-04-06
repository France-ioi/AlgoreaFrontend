import { ChangeDetectionStrategy, Component, inject, OnDestroy, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import { CurrentContentService } from '../../../services/current-content.service';
import { fromCurrentContent } from '../../../store/navigation/current-content/current-content.store';
import { CommunityThreadsComponent } from '../community-threads/community-threads.component';
import { CommunityActivityFeedComponent } from '../community-activity-feed/community-activity-feed.component';
import { CommunityVisitService } from '../../community-visit.service';
import { APPCONFIG } from '../../../config';

@Component({
  selector: 'alg-community-page',
  templateUrl: './community-page.component.html',
  styleUrls: [ './community-page.component.scss' ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommunityThreadsComponent,
    CommunityActivityFeedComponent,
  ],
})
export class CommunityPageComponent implements OnInit, OnDestroy {
  private store = inject(Store);
  private currentContent = inject(CurrentContentService);
  private communityVisitService = inject(CommunityVisitService);
  enableForum = inject(APPCONFIG).featureFlags.enableForum;

  ngOnInit(): void {
    this.currentContent.replace({ type: 'community' });
    this.store.dispatch(fromCurrentContent.contentPageActions.changeContent({
      route: 'community',
      title: $localize`Community`,
    }));
    this.communityVisitService.markVisited();
  }

  ngOnDestroy(): void {
    this.currentContent.clear();
  }
}
