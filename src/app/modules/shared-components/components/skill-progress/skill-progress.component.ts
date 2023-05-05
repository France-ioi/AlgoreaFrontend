import {
  Component,
  Input,
  OnChanges,
} from '@angular/core';

@Component({
  selector: 'alg-skill-progress',
  templateUrl: './skill-progress.component.html',
  styleUrls: [ './skill-progress.component.scss' ],
})
export class SkillProgressComponent implements OnChanges {
  /**@deprecated**/
  @Input() type?: string;
  @Input() currentScore = 0;
  @Input() bestScore = 0;

  private readonly rangeMin = 0;
  private readonly rangeMax = 100;

  constructor() {}

  private validateScore(score: number): number {
    if (score < this.rangeMin) {
      return this.rangeMin;
    }
    if (score > this.rangeMax) {
      return this.rangeMax;
    }

    return score;
  }

  ngOnChanges(): void {
    this.currentScore = this.validateScore(this.currentScore);
    this.bestScore = this.validateScore(this.bestScore);
  }
}
