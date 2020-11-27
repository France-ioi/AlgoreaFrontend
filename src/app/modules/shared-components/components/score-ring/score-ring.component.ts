import {
  Component,
  OnInit,
  Input,
  OnChanges,
  SimpleChanges,
  ViewChild,
  ElementRef,
} from '@angular/core';

enum ScoreRingColor {
  Success = '#B8E986',
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
export class ScoreRingComponent implements OnInit, OnChanges {
  @Input() diameter = 60;
  @Input() currentScore = 0;
  @Input() bestScore = 0;
  @Input() isValidated = false;
  @Input() isStarted = true;
  @Input() isDark = false;
  @Input() isFailed = false;
  @Input() icon?: string; // a font-awesome icon identifier
  @Input() scoreFillColor?: string;
  @Input() forTree = false;
  @Input() textColor?: string;

  @ViewChild('svg') svg?: ElementRef;

  greyedPath?: string;
  greyedFill?: string;

  scorePath?: string;
  scoreFill?: string;

  svgRadius = 30;

  iconFill = 'white';

  textFill = ScoreRingColor.DefaultText;
  fontSize = 1;

  constructor() {}

  ngOnInit(): void {}

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
      this.greyedFill = ScoreRingColor.Success;
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
      this.iconFill = ScoreRingColor.Success;
    } else if (this.isFailed) {
      this.icon = 'times';
      this.iconFill = ScoreRingColor.Initial;
    } else {
      this.icon = undefined;
    }

    if (this.textColor) this.textFill = this.textColor as ScoreRingColor;

    this.fontSize = Math.floor((2 * this.diameter) / 64);
    if (this.forTree) {
      this.fontSize = 1;
    }
  }
}
