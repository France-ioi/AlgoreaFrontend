import {
  Component,
  OnInit,
  Input,
  OnChanges,
  SimpleChanges,
  ViewChild
} from '@angular/core';
import * as fas from '@fortawesome/free-solid-svg-icons';
import { icon } from '@fortawesome/fontawesome-svg-core';

enum ScoreRingColor {
  success = '#B8E986',
  initial = '#F90223',
  defaultText = '#4A4A4A',
  darkText = '#FFF',
  darkBk = '#2E5E95'
}

@Component({
  selector: 'app-score-ring',
  templateUrl: './score-ring.component.html',
  styleUrls: ['./score-ring.component.scss']
})
export class ScoreRingComponent implements OnInit, OnChanges {
  @Input() diameter = 60;
  @Input() innerDiameter = 50;
  @Input() displayedScore = 0;
  @Input() currentScore = 0;
  @Input() isValidated = false;
  @Input() isStarted = true;
  @Input() isDark = false;
  @Input() icons = '';

  @ViewChild('svg', {static: false}) svg;

  _displayPath;
  _displayFill;

  _currentPath;
  _currentFill;

  _svgRadius = 30;

  _iconPath;
  _iconFill = 'white';

  _textFill = ScoreRingColor.defaultText;
  _fontSize = 16;

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
      this._svgRadius * Math.sin((score / 50) * Math.PI) +
      ',' +
      this._svgRadius * -Math.cos((score / 50) * Math.PI) +
      ''
    );
  }

  ngOnChanges(changes: SimpleChanges) {
    // console.log(changes);
    // console.log(this.displayPathRef);
    this._displayPath = this._pathFromScore(this.displayedScore);
    this._currentPath = this._pathFromScore(this.currentScore);
    if (this.displayedScore === 100) {
      this._displayFill = ScoreRingColor.success;
    } else {
      this._displayFill = 'hsl(' + this.displayedScore * 0.4 + ', 100%, 50%)';
      this._currentFill = '#8E8E8E';
    }

    if (this.isDark) {
      this._textFill = ScoreRingColor.darkText;
    } else {
      this._textFill = ScoreRingColor.defaultText;
    }

    if (this.isValidated) {
      this._iconPath = 'check';
      this._iconFill = ScoreRingColor.success;
    } else if (this.displayedScore === 0) {
      this._iconPath = 'times';
      this._iconFill = ScoreRingColor.initial;
    } else if (this.icons) {
      if (this.isDark) {
        this._iconFill = 'white';
      } else {
        this._iconFill = ScoreRingColor.defaultText;
      }
      this._iconPath = this.icons;
    } else {
      this._iconPath = '';
    }

    this._fontSize = Math.floor(14 * 2 * this.diameter / 64);
  }
}
