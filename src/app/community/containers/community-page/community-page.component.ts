import { ChangeDetectionStrategy, Component, inject, OnDestroy, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import { CurrentContentService } from '../../../services/current-content.service';
import { fromCurrentContent } from '../../../store/navigation/current-content/current-content.store';
import { ContentDisplayType, LayoutService } from '../../../services/layout.service';
import { CommunityThreadsComponent } from '../community-threads/community-threads.component';
import { CommunityActivityFeedComponent } from '../community-activity-feed/community-activity-feed.component';

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
  private layoutService = inject(LayoutService);

  ngOnInit(): void {
    this.currentContent.replace({ type: 'community' });
    this.layoutService.configure({ contentDisplayType: ContentDisplayType.Show });
    this.store.dispatch(fromCurrentContent.contentPageActions.changeContent({
      route: 'community',
      title: $localize`Community`,
    }));
  }

  ngOnDestroy(): void {
    this.currentContent.clear();
  }
}
