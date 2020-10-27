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
  success = '#B8E986',
  initial = '#F90223',
  defaultText = '#4A4A4A',
  darkText = '#FFF',
  darkBk = '#2E5E95',
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

  @ViewChild('svg') svg?: ElementRef;

  greyedPath?: string;
  greyedFill?: string;

  scorePath?: string;
  scoreFill?: string;

  svgRadius = 30;

  iconFill = 'white';

  textFill = ScoreRingColor.defaultText;
  fontSize = 1;

  constructor() {}

  ngOnInit() {}

  _pathFromScore(score: number) {
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

  ngOnChanges(_changes: SimpleChanges) {
    if (this.scoreFillColor) {
      this.greyedFill = this.scoreFillColor;
      this.textFill = ScoreRingColor.darkText;
    } else {
      if (this.isDark) {
        this.textFill = ScoreRingColor.darkText;
      } else {
        this.textFill = ScoreRingColor.defaultText;
      }
    }

    this.greyedPath = this._pathFromScore(this.currentScore);
    this.scorePath = this._pathFromScore(this.bestScore);
    if (this.currentScore === 100) {
      this.greyedFill = ScoreRingColor.success;
    } else if (!this.scoreFillColor) {
      this.greyedFill = `hsl(${this.currentScore * 0.4 }, 100%, 50%)`;
      this.scoreFill = '#8E8E8E';
    }

    if (this.icon) {
      if (this.isDark) {
        this.iconFill = 'white';
      } else {
        this.iconFill = ScoreRingColor.defaultText;
      }
    } else if (this.isValidated) {
      this.icon = 'check';
      this.iconFill = ScoreRingColor.success;
    } else if (this.isFailed) {
      this.icon = 'times';
      this.iconFill = ScoreRingColor.initial;
    } else {
      this.icon = undefined;
    }

    this.fontSize = Math.floor((2 * this.diameter) / 64);
    if (this.forTree) {
      this.fontSize = 1;
    }
  }
}
