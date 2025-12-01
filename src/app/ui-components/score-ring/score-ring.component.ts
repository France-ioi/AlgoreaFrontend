import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { NgStyle, NgIf, NgClass, DecimalPipe } from '@angular/common';

@Component({
  selector: 'alg-score-ring',
  templateUrl: './score-ring.component.html',
  styleUrls: [ './score-ring.component.scss' ],
  standalone: true,
  imports: [
    NgStyle,
    NgIf,
    NgClass,
    DecimalPipe,
  ],
})
export class ScoreRingComponent implements OnChanges {
  @Input() diameter = 32;
  @Input() currentScore: number|null = 0;
  @Input() bestScore = 0;
  @Input() isValidated = false;
  /**@deprecated**/
  @Input() icon?: string; // a font-awesome icon identifier
  /**@deprecated**/
  @Input() scoreFillColor?: string;
  @Input() compact = false;

  svgRadius = 30;
  currentScorePath?: string;
  bestScorePath?: string;

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

  ngOnChanges(_changes: SimpleChanges): void {
    this.currentScorePath = this.pathFromScore(this.currentScore ?? 0);
    this.bestScorePath = this.pathFromScore(this.bestScore);
  }
}
