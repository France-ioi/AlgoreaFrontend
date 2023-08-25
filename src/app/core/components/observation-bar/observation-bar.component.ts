import { Component, EventEmitter, Input, Output } from '@angular/core';
import { GroupWatchingService } from '../../services/group-watching.service';

@Component({
  selector: 'alg-observation-bar',
  templateUrl: './observation-bar.component.html',
  styleUrls: [ './observation-bar.component.scss' ]
})
export class ObservationBarComponent {
  @Output() cancel = new EventEmitter<void>();
  @Input() caption?: string;
  @Input() onlyIcon = false;

  watchedGroup$ = this.groupWatchingService.watchedGroup$;

  constructor(
    private groupWatchingService: GroupWatchingService,
  ) {}

  onCancelClick(): void {
    this.groupWatchingService.stopWatching();
  }

}
