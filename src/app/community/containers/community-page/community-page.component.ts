import { ChangeDetectionStrategy, Component, inject, OnDestroy, OnInit } from '@angular/core';
import { CurrentContentService } from '../../../services/current-content.service';

@Component({
  selector: 'alg-community-page',
  template: '<p i18n>Community (coming soon)</p>',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CommunityPageComponent implements OnInit, OnDestroy {
  private currentContent = inject(CurrentContentService);

  ngOnInit(): void {
    this.currentContent.replace({ type: 'community' });
  }

  ngOnDestroy(): void {
    this.currentContent.clear();
  }
}
