import { Component, EventEmitter, Input, Output } from '@angular/core';
import { GroupLinkPipe } from 'src/app/pipes/groupLink';
import { RouterLink } from '@angular/router';
import { TooltipModule } from 'primeng/tooltip';
import { NgIf, NgClass, AsyncPipe } from '@angular/common';
import { Store } from '@ngrx/store';
import { fromObservation } from 'src/app/store/observation';
import { GroupIsUserPipe } from 'src/app/pipes/groupIsUser';
import { ButtonIconComponent } from 'src/app/ui-components/button-icon/button-icon.component';

@Component({
  selector: 'alg-observation-bar',
  templateUrl: './observation-bar.component.html',
  styleUrls: [ './observation-bar.component.scss' ],
  standalone: true,
  imports: [ NgIf, NgClass, TooltipModule, RouterLink, AsyncPipe, GroupLinkPipe, GroupIsUserPipe, ButtonIconComponent ]
})
export class ObservationBarComponent {
  @Output() cancel = new EventEmitter<void>();
  @Input() caption?: string;
  @Input() onlyIcon = false;
  @Input() showTooltip = false;

  observedGroup$ = this.store.select(fromObservation.selectObservedGroupInfo);
  activeContentIsBeingObserved$ = this.store.select(fromObservation.selectActiveContentIsBeingObserved);

  constructor(
    private store: Store
  ) {}

  onCancelClick(): void {
    this.store.dispatch(fromObservation.observationBarActions.disableObservation());
  }

}
