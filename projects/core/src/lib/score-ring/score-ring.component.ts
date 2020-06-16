import {
  Component,
  OnInit,
  Input,
  OnChanges,
  SimpleChanges,
  ViewChild,
} from '@angular/core';

enum ScoreRingColor {
  success = '#B8E986',
  initial = '#F90223',
  defaultText = '#4A4A4A',
  darkText = '#FFF',
  darkBk = '#2E5E95',
}

@Component({
  selector: 'app-score-ring',
  templateUrl: './score-ring.component.html',
  styleUrls: ['./score-ring.component.scss'],
})
export class ScoreRingComponent implements OnInit, OnChanges {
  @Input() diameter = 60;
  @Input() innerDiameter = 50;
  @Input() displayedScore = 0;
  @Input() currentScore = 0;
  @Input() isValidated = false;
  @Input() isStarted = true;
  @Input() isDark = false;
  @Input() isFailed = false;
  @Input() icons = '';
  @Input() scoreFill = '';
  @Input() forTree = false;

  @ViewChild('svg') svg;

  displayPath;
  displayFill;

  currentPath;
  currentFill;

  svgRadius = 30;

  iconPath;
  iconFill = 'white';

  textFill = ScoreRingColor.defaultText;
  fontSize = 1;

  constructor() {}

  ngOnInit() {}

  _pathFromScore(score) {
    if (score === 0) {
      return 'M0, -30';
    }
    if (score === 100) {
      return 'M0,-30 a30,30 0 0,1 0,60  a30,30 0 1,1 0,-60';
    }

    return (
      'M0,-30 A30,30 1 ' +
      (score > 50 ? 1 : 0) +
      ',1 ' +
      this.svgRadius * Math.sin((score / 50) * Math.PI) +
      ',' +
      this.svgRadius * -Math.cos((score / 50) * Math.PI) +
      ''
    );
  }

  ngOnChanges(_changes: SimpleChanges) {
    if (this.scoreFill.length > 0) {
      this.displayFill = this.scoreFill;
      this.textFill = ScoreRingColor.darkText;
    } else {
      if (this.isDark) {
        this.textFill = ScoreRingColor.darkText;
      } else {
        this.textFill = ScoreRingColor.defaultText;
      }
    }

    this.displayPath = this._pathFromScore(this.displayedScore);
    this.currentPath = this._pathFromScore(this.currentScore);
    if (this.displayedScore === 100) {
      this.displayFill = ScoreRingColor.success;
    } else if (this.scoreFill.length === 0) {
      this.displayFill = 'hsl(' + this.displayedScore * 0.4 + ', 100%, 50%)';
      this.currentFill = '#8E8E8E';
    }

    if (this.icons) {
      if (this.isDark) {
        this.iconFill = 'white';
      } else {
        this.iconFill = ScoreRingColor.defaultText;
      }
      this.iconPath = this.icons;
    } else if (this.isValidated) {
      this.iconPath = 'check';
      this.iconFill = ScoreRingColor.success;
    } else if (this.isFailed) {
      this.iconPath = 'times';
      this.iconFill = ScoreRingColor.initial;
    } else {
      this.iconPath = '';
    }

    this.fontSize = Math.floor((2 * this.diameter) / 64);
    if (this.forTree) {
      this.fontSize = 1;
    }
  }
}
