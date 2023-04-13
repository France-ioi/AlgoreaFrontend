import { Component, Input, OnChanges, SimpleChanges, ViewChild, ElementRef } from '@angular/core';

enum ScoreRingColor {
  Success = '#69ce4d',
  DarkSuccess = '#B8E986',
  Initial = '#F90223',
  DefaultText = '#4A4A4A',
  DarkText = '#FFF',
  DarkBk = '#2E5E95',
}

@Component({
  selector: 'alg-score-ring',
  templateUrl: './score-ring.component.html',
  styleUrls: [ './score-ring.component.scss' ],
})
export class ScoreRingComponent implements OnChanges {
  @Input() diameter = 60;
  @Input() currentScore = 0;
  @Input() bestScore = 0;
  @Input() isValidated = false;
  @Input() isDark = false;
  @Input() icon?: string; // a font-awesome icon identifier
  @Input() scoreFillColor?: string;
  @Input() forTree = false;
  @Input() forDarkBg = false;

  @ViewChild('svg') svg?: ElementRef;

  greyedPath?: string;
  greyedFill?: string;

  scorePath?: string;
  scoreFill?: string;

  svgRadius = 30;

  iconFill = 'white';

  textFill = ScoreRingColor.DefaultText;
  fontSize = 12;

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
    if (this.scoreFillColor) {
      this.greyedFill = this.scoreFillColor;
      this.textFill = ScoreRingColor.DarkText;
    } else {
      if (this.isDark) {
        this.textFill = ScoreRingColor.DarkText;
      } else {
        this.textFill = ScoreRingColor.DefaultText;
      }
    }

    this.greyedPath = this.pathFromScore(this.currentScore);
    this.scorePath = this.pathFromScore(this.bestScore);
    if (this.currentScore === 100) {
      if (this.forDarkBg) {
        this.greyedFill = ScoreRingColor.DarkSuccess;
      } else {
        this.greyedFill = ScoreRingColor.Success;
      }
    } else if (!this.scoreFillColor) {
      this.greyedFill = `hsl(${this.currentScore * 0.4 }, 100%, 50%)`;
      this.scoreFill = '#8E8E8E';
    }

    if (this.icon) {
      if (this.isDark) {
        this.iconFill = 'white';
      } else {
        this.iconFill = ScoreRingColor.DefaultText;
      }
    } else if (this.isValidated) {
      this.icon = 'check';
      if (this.forDarkBg) {
        this.iconFill = ScoreRingColor.DarkSuccess;
      } else {
        this.iconFill = ScoreRingColor.Success;
      }
    } else {
      this.icon = undefined;
    }
  }
}
