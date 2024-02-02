import { Component, OnDestroy } from '@angular/core';
import { ItemNavigationService } from '../../data-access/item-navigation.service';
import { switchMap, filter, map } from 'rxjs/operators';
import { isNotNull } from '../../utils/null-undefined-predicates';
import { mapToFetchState } from 'src/app/utils/operators/state';
import { Subject } from 'rxjs';
import { RouteUrlPipe } from 'src/app/pipes/routeUrl';
import { RawItemRoutePipe } from 'src/app/pipes/itemRoute';
import { RouterLink } from '@angular/router';
import { SharedModule } from 'primeng/api';
import { ErrorComponent } from '../../ui-components/error/error.component';
import { LoadingComponent } from '../../ui-components/loading/loading.component';
import { NgIf, AsyncPipe, NgFor, I18nSelectPipe } from '@angular/common';
import { Store } from '@ngrx/store';
import { fromObservation } from 'src/app/store/observation';
import { GroupIsUserPipe } from 'src/app/pipes/groupIsUser';

@Component({
  selector: 'alg-suggestion-of-activities',
  templateUrl: './suggestion-of-activities.component.html',
  styleUrls: [ './suggestion-of-activities.component.scss' ],
  standalone: true,
  imports: [
    NgIf,
    LoadingComponent,
    ErrorComponent,
    SharedModule,
    RouterLink,
    AsyncPipe,
    RawItemRoutePipe,
    RouteUrlPipe,
    NgFor,
    I18nSelectPipe,
    GroupIsUserPipe,
  ],
})
export class SuggestionOfActivitiesComponent implements OnDestroy {
  observedGroupRoute$ = this.store.select(fromObservation.selectObservedGroupRoute);
  private refresh$ = new Subject<void>();
  readonly state$ = this.observedGroupRoute$.pipe(
    filter(isNotNull),
    switchMap(observedGroupRoute =>
      this.itemNavigationService.getRootActivities(observedGroupRoute.id).pipe(
        map(rootActivities => [
          ...rootActivities.filter(act => act.groupId === observedGroupRoute.id),
          ...rootActivities.filter(act => act.groupId !== observedGroupRoute.id),
        ].slice(0, 4))
      )
    ),
    mapToFetchState({ resetter: this.refresh$ }),
  );

  constructor(
    private store: Store,
    private itemNavigationService: ItemNavigationService) {
  }

  ngOnDestroy(): void {
    this.refresh$.complete();
  }

  refresh(event: MouseEvent): void {
    event.stopPropagation();
    this.refresh$.next();
  }

}
