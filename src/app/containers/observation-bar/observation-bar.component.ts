import { Component, EventEmitter, Input, Output } from '@angular/core';
import { GroupWatchingService } from '../../services/group-watching.service';
import { GroupLinkPipe } from 'src/app/pipes/groupLink';
import { ButtonModule } from 'primeng/button';
import { RouterLink } from '@angular/router';
import { TooltipModule } from 'primeng/tooltip';
import { NgIf, NgClass, AsyncPipe } from '@angular/common';

@Component({
  selector: 'alg-observation-bar',
  templateUrl: './observation-bar.component.html',
  styleUrls: [ './observation-bar.component.scss' ],
  standalone: true,
  imports: [ NgIf, NgClass, TooltipModule, RouterLink, ButtonModule, AsyncPipe, GroupLinkPipe ]
})
export class ObservationBarComponent {
  @Output() cancel = new EventEmitter<void>();
  @Input() caption?: string;
  @Input() onlyIcon = false;
  @Input() showTooltip = false;

  watchedGroup$ = this.groupWatchingService.watchedGroup$;

  constructor(
    private groupWatchingService: GroupWatchingService,
  ) {}

  onCancelClick(): void {
    this.groupWatchingService.stopWatching();
  }

}
