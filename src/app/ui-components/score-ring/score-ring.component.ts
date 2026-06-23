import { Component, computed, input } from '@angular/core';
import { DecimalPipe } from '@angular/common';

@Component({
  selector: 'alg-score-ring',
  templateUrl: './score-ring.component.html',
  styleUrl: './score-ring.component.scss',
  imports: [
    DecimalPipe,
  ]
})
export class ScoreRingComponent {
  diameter = input(32);
  currentScore = input<number | null>(0);
  bestScore = input(0);
  isValidated = input(false);
  compact = input(false);

  private readonly svgRadius = 30;

  protected readonly currentScorePath = computed(() => this.pathFromScore(this.currentScore() ?? 0));
  protected readonly bestScorePath = computed(() => this.pathFromScore(this.bestScore()));

  private pathFromScore(score: number): string {
    if (score === 0) {
      return 'M0, -30';
    }
    if (score === 100) {
      return 'M0,-30 a30,30 0 0,1 0,60  a30,30 0 1,1 0,-60';
    }

    const h = this.svgRadius * Math.sin((score / 50) * Math.PI);
    const w = this.svgRadius * -Math.cos((score / 50) * Math.PI);

    return `M0,-30 A30,30 1 ${score > 50 ? 1 : 0},1 ${h},${w}`;
  }
}
