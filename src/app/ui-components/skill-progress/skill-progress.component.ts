import { Component, computed, input } from '@angular/core';

@Component({
  selector: 'alg-skill-progress',
  templateUrl: './skill-progress.component.html',
  styleUrls: [ './skill-progress.component.scss' ],
})
export class SkillProgressComponent {
  type = input<'thin' | 'bold' | 'thick-horizontal'>('thin');
  currentScore = input(0);
  bestScore = input(0);

  private readonly rangeMin = 0;
  private readonly rangeMax = 100;

  protected readonly clampedCurrentScore = computed(() => this.validateScore(this.currentScore()));
  protected readonly clampedBestScore = computed(() => this.validateScore(this.bestScore()));

  private validateScore(score: number): number {
    if (score < this.rangeMin) {
      return this.rangeMin;
    }
    if (score > this.rangeMax) {
      return this.rangeMax;
    }

    return score;
  }
}
