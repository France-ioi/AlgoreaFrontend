import { Component, OnInit, Input, OnChanges, SimpleChanges } from '@angular/core';

export enum ProgressColor {
  Red = '#FF001F',
  Orange = '#FCC16E',
  Green = '#B8E986',
  Thick = '#F2F2F2',
  Thin = '#CFD0D4'
}

export enum ProgressType {
  ThinHorizontal = 'thin-horizontal',
  ThickHorizontal = 'thick-horizontal',
  ThickVertical = 'vertical'
}

enum ProgressHeight {
  Thin = 5,
  Thick = 16
}

@Component({
  selector: 'app-skill-progress',
  templateUrl: './skill-progress.component.html',
  styleUrls: ['./skill-progress.component.scss']
})
export class SkillProgressComponent implements OnInit, OnChanges {

  ProgressType = ProgressType;

  @Input() type = ProgressType.ThinHorizontal;
  @Input() displayedScore = 0;
  @Input() currentScore = 0;
  @Input() color = ProgressColor.Thin;

  _progressHeight = ProgressHeight.Thin;
  _currentColor;
  _displayColor;
  
  RANGE_MIN = 0;
  RANGE_MAX = 100;

  constructor() {}

  _validateScore(score) {

    if (score < this.RANGE_MIN) {
      return this.RANGE_MIN;
    }
    if (score > this.RANGE_MAX) {
      return this.RANGE_MAX;
    }

    return score;
  }

  ngOnInit() {
    this._validateScore(this.displayedScore);
    this._validateScore(this.currentScore);
    
    if (this.type === ProgressType.ThinHorizontal) {
        this._progressHeight = ProgressHeight.Thin;
        this.color = ProgressColor.Thin;
    } else if (this.type === ProgressType.ThickHorizontal) {
        this._progressHeight = ProgressHeight.Thick;
    }
  }

  ngOnChanges(changes: SimpleChanges) {
    if (this.displayedScore === 100) {
      this._displayColor = '#B8E986';
    } else {
      this._displayColor = 'hsl(' + (this.displayedScore * 0.4) + ', 100%, 50%)';
      this._currentColor = 'hsl(' + (this.currentScore * 0.4) + ', 100%, 70%)';
    }
  }
}
