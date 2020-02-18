import { Component, OnInit, Input } from '@angular/core';

@Component({
  selector: 'app-attempts-view',
  templateUrl: './attempts-view.component.html',
  styleUrls: ['./attempts-view.component.scss']
})
export class AttemptsViewComponent implements OnInit {

  @Input() attempts;

  selectedAttempt = {};

  selectedAttemptID = -1;

  constructor() { }

  ngOnInit() {
  }

  selectAttempt(id) {
    this.selectedAttemptID = id;
    for (const attempt of this.attempts) {
      if (attempt.ID === id) {
        this.selectedAttempt = attempt;
        break;
      }
    }
  }

  newAttempt(e) {
    const newID = this.attempts[this.attempts.length - 1].ID + 1;
    this.attempts.push({
      ID: newID,
      number: newID,
      progress: {
        displayedScore: 75,
        currentScore: 75
      },
      date: new Date(),
      author: 'Mathieu',
      lang: 'Python'
    });
  }

}
