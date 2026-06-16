import { Component, computed, input } from '@angular/core';
import { ParticipantProgresses } from 'src/app/data-access/get-group-progress.service';
import { ScoreRingComponent } from 'src/app/ui-components/score-ring/score-ring.component';

@Component({
  selector: 'alg-user-progress',
  templateUrl: './user-progress.component.html',
  styleUrls: [ './user-progress.component.scss' ],
  imports: [ ScoreRingComponent ]
})
export class UserProgressComponent {

  userProgress = input.required<ParticipantProgresses[number]>();

  protected readonly state = computed((): 'success' | 'in-progress' | 'no-score' | 'not-started' => {
    const progress = this.userProgress();
    if (progress.validated || progress.score === 100) return 'success';
    if (progress.score > 0) return 'in-progress';
    if (progress.score === 0 && progress.latestActivityAt !== null) return 'no-score';
    return 'not-started';
  });

}
