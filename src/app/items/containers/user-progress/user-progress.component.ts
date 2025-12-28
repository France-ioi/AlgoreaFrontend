import { Component, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { mustNotBeUndefined } from 'src/app/utils/assert';
import { ParticipantProgresses } from 'src/app/data-access/get-group-progress.service';
import { ScoreRingComponent } from 'src/app/ui-components/score-ring/score-ring.component';
import { NgClass, NgIf } from '@angular/common';

@Component({
  selector: 'alg-user-progress[userProgress]',
  templateUrl: './user-progress.component.html',
  styleUrls: [ './user-progress.component.scss' ],
  imports: [ NgClass, NgIf, ScoreRingComponent ]
})
export class UserProgressComponent implements OnInit, OnChanges {

  @Input() userProgress!: ParticipantProgresses[number];

  state: 'success'|'in-progress'|'no-score'|'not-started' = 'no-score';

  ngOnInit(): void {
    // When the component has no inputs, the hook onChange is not executed.
    // Therefore, the user progress assertion must be declared also at init.
    mustNotBeUndefined(this.userProgress, 'user progress must be defined');
  }

  ngOnChanges(_changes: SimpleChanges): void {
    mustNotBeUndefined(this.userProgress, 'user progress must be defined');

    if (this.userProgress.validated || this.userProgress.score === 100) this.state = 'success';
    else if (this.userProgress.score > 0) this.state = 'in-progress';
    else if (this.userProgress.score === 0 && this.userProgress.latestActivityAt !== null) this.state = 'no-score';
    else this.state = 'not-started';
  }

}
