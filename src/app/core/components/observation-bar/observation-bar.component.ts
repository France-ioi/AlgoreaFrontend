import { Component, EventEmitter, Output } from '@angular/core';
import { UserSessionService } from '../../../shared/services/user-session.service';
import { ModeService } from '../../../shared/services/mode.service';

@Component({
  selector: 'alg-observation-bar',
  templateUrl: './observation-bar.component.html',
  styleUrls: [ './observation-bar.component.scss' ]
})
export class ObservationBarComponent {
  @Output() cancel = new EventEmitter<void>();

  watchedGroup$ = this.sessionService.watchedGroup$;

  constructor(
    private sessionService: UserSessionService,
    private modeService: ModeService,
  ) {
  }

  onCancelClick(): void {
    this.modeService.stopObserving();
  }

}
