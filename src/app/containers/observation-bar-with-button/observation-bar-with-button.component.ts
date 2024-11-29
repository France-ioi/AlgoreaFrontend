import { Component, OnDestroy, ViewChild } from '@angular/core';
import { OverlayPanel, OverlayPanelModule } from 'primeng/overlaypanel';
import { LayoutService } from '../../services/layout.service';
import { combineLatest, map } from 'rxjs';
import { isGroupInfo } from '../../models/content/group-info';
import { CurrentContentService } from '../../services/current-content.service';
import {
  SuggestionOfActivitiesComponent
} from '../suggestion-of-activities/suggestion-of-activities.component';
import { ButtonModule } from 'primeng/button';
import { LetDirective } from '@ngrx/component';
import { ObservationBarComponent } from '../observation-bar/observation-bar.component';
import { NgIf, NgClass, AsyncPipe } from '@angular/common';
import { Store } from '@ngrx/store';
import { ObservationInfo, fromObservation } from 'src/app/store/observation';

@Component({
  selector: 'alg-observation-bar-with-button',
  templateUrl: 'observation-bar-with-button.component.html',
  styleUrls: [ './observation-bar-with-button.component.scss' ],
  standalone: true,
  imports: [
    NgIf,
    ObservationBarComponent,
    LetDirective,
    ButtonModule,
    NgClass,
    OverlayPanelModule,
    SuggestionOfActivitiesComponent,
    AsyncPipe,
  ],
})
export class ObservationBarWithButtonComponent implements OnDestroy {
  @ViewChild('op') op?: OverlayPanel;

  currentContent$ = this.currentContentService.content$;
  isObserving$ = this.store.select(fromObservation.selectIsObserving);
  isNarrowScreen$ = this.layoutService.isNarrowScreen$;
  currentGroupContent$ = combineLatest([
    this.currentContent$,
    this.store.select(fromObservation.selectObservedGroupId),
  ]).pipe(
    map(([ currentContent, observedGroupId ]) => (isGroupInfo(currentContent) && currentContent.details?.currentUserCanWatchMembers ? {
      ...currentContent,
      isBeingWatched: currentContent.route.id === observedGroupId,
    } : undefined)),
  );

  subscription = this.isObserving$.subscribe(isObserving => {
    if (!isObserving && this.op?.overlayVisible) {
      this.op.hide();
    }
  });

  constructor(
    private store: Store,
    private layoutService: LayoutService,
    private currentContentService: CurrentContentService,
  ) {}

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  openSuggestionOfActivitiesOverlayPanel(event: Event, target: HTMLDivElement): void {
    this.op?.show(event, target);
    // Align method needs to be called because top banner of observing group
    // changes position of the page and as result we have a bug with wrong tooltip positioning.
    // Async function/wrapper setTimeout - guarantees to call align method after position of page changed
    setTimeout(() => {
      this.op?.align();
    });
  }

  toggleObservation(event: Event, target: HTMLDivElement, observationInfo: ObservationInfo): void {
    this.store.dispatch(fromObservation.topBarActions.enableObservation(observationInfo));
    this.openSuggestionOfActivitiesOverlayPanel(event, target);

  }
}
