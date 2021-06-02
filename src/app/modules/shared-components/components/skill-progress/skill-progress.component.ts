import {
  Component,
  OnInit,
  Input,
  OnChanges,
  SimpleChanges,
} from '@angular/core';

export enum ProgressColor {
  Red = '#FF001F',
  Orange = '#FCC16E',
  Green = '#B8E986',
  Thick = '#F2F2F2',
  Thin = '#CFD0D4',
}

type ProgressType = 'thin-horizontal'|'thick-horizontal'|'vertical';

enum ProgressHeight {
  Thin = 0.4167,
  Thick = 1.3333,
}

@Component({
  selector: 'alg-skill-progress',
  templateUrl: './skill-progress.component.html',
  styleUrls: [ './skill-progress.component.scss' ],
})
export class SkillProgressComponent implements OnInit, OnChanges {

  @Input() type: ProgressType = 'thin-horizontal';
  @Input() currentScore = 0;
  @Input() bestScore = 0;
  @Input() color = ProgressColor.Thin;

  progressHeight = ProgressHeight.Thin;
  currentColor: string = ProgressColor.Thin;
  displayColor: string = ProgressColor.Green;

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

  ngOnInit(): void {
    this.validateScore(this.currentScore);
    this.validateScore(this.bestScore);

    if (this.type === 'thin-horizontal') {
      this.progressHeight = ProgressHeight.Thin;
      this.color = ProgressColor.Thin;
    } else if (this.type === 'thick-horizontal') {
      this.progressHeight = ProgressHeight.Thick;
    }
  }

  ngOnChanges(_changes: SimpleChanges): void {
    if (this.currentScore === 100) {
      this.displayColor = '#B8E986';
    } else {
      this.displayColor = `hsl(${this.currentScore * 0.4}, 100%, 50%)`;
      this.currentColor = `hsl(${this.bestScore * 0.4}, 100%, 70%)`;
    }
  }
}
