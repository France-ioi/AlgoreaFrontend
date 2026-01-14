import { Component, EventEmitter, Input, Output } from '@angular/core';
import { GroupLinkPipe } from 'src/app/pipes/groupLink';
import { RouterLink } from '@angular/router';
import { NgClass, AsyncPipe } from '@angular/common';
import { Store } from '@ngrx/store';
import { fromObservation } from 'src/app/store/observation';
import { GroupIsUserPipe } from 'src/app/pipes/groupIsUser';
import { ButtonIconComponent } from 'src/app/ui-components/button-icon/button-icon.component';
import { fromItemContent } from 'src/app/items/store';
import { filter, take } from 'rxjs';
import { ItemRouter } from 'src/app/models/routing/item-router';
import { isNotNull } from 'src/app/utils/null-undefined-predicates';
import { routeWithNoObservation } from 'src/app/models/routing/item-route';
import { TooltipDirective } from 'src/app/ui-components/tooltip/tooltip.directive';

@Component({
  selector: 'alg-observation-bar',
  templateUrl: './observation-bar.component.html',
  styleUrls: [ './observation-bar.component.scss' ],
  imports: [ NgClass, RouterLink, AsyncPipe, GroupLinkPipe, GroupIsUserPipe, ButtonIconComponent, TooltipDirective ]
})
export class ObservationBarComponent {
  @Output() cancel = new EventEmitter<void>();
  @Input() caption?: string;
  @Input() onlyIcon = false;
  @Input() showTooltip = false;

  observedGroup$ = this.store.select(fromObservation.selectObservedGroupInfo);
  activeContentIsBeingObserved$ = this.store.select(fromObservation.selectActiveContentIsBeingObserved);
  activeItemRoute$ = this.store.select(fromItemContent.selectActiveContentRoute);

  constructor(
    private store: Store,
    private itemRouter: ItemRouter,
  ) {}

  onCancelClick(): void {
    this.activeItemRoute$.pipe(
      take(1),
      filter(isNotNull),
    ).subscribe(route => {
      this.itemRouter.navigateTo(routeWithNoObservation(route));
    });
  }

}
