import { Component, inject, input, Output, ViewChild } from '@angular/core';
import { distinctUntilChanged, filter, map, switchMap } from 'rxjs/operators';
import { isNotUndefined } from '../../utils/null-undefined-predicates';
import { ActivityNavTreeService, SkillNavTreeService } from '../../services/navigation/item-nav-tree.service';
import { GroupNavTreeService } from '../../services/navigation/group-nav-tree.service';
import { readyData } from 'src/app/utils/operators/state';
import { NgScrollbar } from 'ngx-scrollbar';
import { LayoutService } from '../../services/layout.service';
import { LeftNavTreeComponent } from '../left-nav-tree/left-nav-tree.component';
import { ObservationBarComponent } from '../observation-bar/observation-bar.component';
import { ErrorComponent } from '../../ui-components/error/error.component';
import { LoadingComponent } from '../../ui-components/loading/loading.component';
import { AsyncPipe } from '@angular/common';
import { Store } from '@ngrx/store';
import { fromObservation } from 'src/app/store/observation';
import { NavTreeData } from 'src/app/models/left-nav-loading/nav-tree-data';
import { toObservable } from '@angular/core/rxjs-interop';

@Component({
  selector: 'alg-left-nav',
  templateUrl: './left-nav.component.html',
  styleUrls: [ './left-nav.component.scss' ],
  imports: [
    LoadingComponent,
    ErrorComponent,
    NgScrollbar,
    ObservationBarComponent,
    LeftNavTreeComponent,
    AsyncPipe,
  ]
})
export class LeftNavComponent {
  private store = inject(Store);
  private activityNavTreeService = inject(ActivityNavTreeService);
  private skillNavTreeService = inject(SkillNavTreeService);
  private groupNavTreeService = inject(GroupNavTreeService);
  private layoutService = inject(LayoutService);

  @ViewChild(NgScrollbar, { static: false }) scrollbarRef?: NgScrollbar;

  treeIndex = input.required<number>();

  readonly navTreeServices = [ this.activityNavTreeService, this.skillNavTreeService, this.groupNavTreeService ];

  @Output() selectElement = toObservable(this.treeIndex).pipe(
    map(idx => this.navTreeServices[idx]),
    filter(isNotUndefined),
    switchMap(service => service.state$),
    readyData<NavTreeData>(),
    map(navTreeData => navTreeData.selectedElementId),
    distinctUntilChanged(),
  );

  isObserving$ = this.store.select(fromObservation.selectIsObserving);
  isNarrowScreen$ = this.layoutService.isNarrowScreen$;

  observationModeCaption = $localize`Observation mode`;

  retryError(treeIndex: number): void {
    this.navTreeServices[treeIndex]?.retry();
  }
}
