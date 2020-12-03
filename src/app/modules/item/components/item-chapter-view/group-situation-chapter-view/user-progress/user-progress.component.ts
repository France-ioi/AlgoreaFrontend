import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { TeamUserProgress } from 'src/app/shared/http-services/get-group-progress.service';

@Component({
  selector: 'alg-user-progress',
  templateUrl: './user-progress.component.html',
  styleUrls: [ './user-progress.component.scss' ]
})
export class UserProgressComponent implements OnChanges {

  @Input() userProgress?: TeamUserProgress;

  state: 'success'|'in-progress'|'no-score'|'not-started' = 'no-score';

  ngOnChanges(_changes: SimpleChanges): void {
    if (!this.userProgress) return;

    if (this.userProgress.validated || this.userProgress.score === 100) this.state = 'success';
    else if (this.userProgress.score > 0) this.state = 'in-progress';
    else if (this.userProgress.score === 0 && this.userProgress.timeSpent > 0) this.state = 'no-score';
    else this.state = 'not-started';
  }
}
