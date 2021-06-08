import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges, ViewChild } from '@angular/core';
import { TeamUserProgress } from 'src/app/shared/http-services/get-group-progress.service';
import { OverlayPanel } from 'primeng/overlaypanel';

@Component({
  selector: 'alg-user-progress',
  templateUrl: './user-progress.component.html',
  styleUrls: [ './user-progress.component.scss' ]
})
export class UserProgressComponent implements OnChanges {

  @Input() userProgress?: TeamUserProgress;
  @Input() canAccess?: boolean;

  @Output() permEditionRequested = new EventEmitter<void>();

  @ViewChild('op') op?: OverlayPanel;

  state: 'success'|'in-progress'|'no-score'|'not-started' = 'no-score';

  ngOnChanges(_changes: SimpleChanges): void {
    if (!this.userProgress) return;

    if (this.userProgress.validated || this.userProgress.score === 100) this.state = 'success';
    else if (this.userProgress.score > 0) this.state = 'in-progress';
    else if (this.userProgress.score === 0 && this.userProgress.timeSpent > 0) this.state = 'no-score';
    else this.state = 'not-started';
  }

  onAccess(): void {
    this.permEditionRequested.emit();
  }

  onClick(event: Event): void {
    if (!this.op || this.state === 'not-started') {
      return;
    }

    this.op.toggle(event);
  }
}
