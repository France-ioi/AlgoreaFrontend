import { Component, OnInit, Input } from '@angular/core';

export enum TeamMemberEnum {
  all_members = 'all memebers of your team must be qualified',
  at_least = 'at least half of the members of your team must be qualified',
  you_must = 'you must be qualified'
}

@Component({
  selector: 'app-task-header',
  templateUrl: './task-header.component.html',
  styleUrls: ['./task-header.component.scss']
})
export class TaskHeaderComponent implements OnInit {

  @Input() isStarted = false;
  @Input() isCoordinator = false;
  @Input() isFinished = true;
  @Input() isCollapsed = false;
  @Input() isFolded = false;
  @Input() isScrolled = false;
  @Input() title;
  @Input() editing;
  @Input() parents;
  @Input() activityORSkill = true;
  @Input() progress;

  @Input() ID;

  teamdata = [
    {
      ID: 1,
      image: 'assets/images/_messi.jpg',
      col2: 'Jean-Michel MAZZERO',
      col3: 'Jeanmaz',
      col4: 'Qualifie'
    },
    {
      ID: 2,
      image: 'assets/images/_messi.jpg',
      col2: 'Claude PONTI',
      col3: 'Clodepont',
      col4: 'Non-qualifie'
    },
    {
      ID: 3,
      image: 'assets/images/_messi.jpg',
      col2: 'Bernard HENRI',
      col3: 'Bernarde',
      col4: 'Qualifie'
    }
  ];

  preq = {
    validated: false,
    team: {
      validated: true,
      min: 1,
      max: 4
    },
    member: {
      validated: false,
      label: TeamMemberEnum.all_members
    },
    scores: {
      validated: false,
      req: [
        {
          label: 'Graph methods',
          type: 'progress',
          progress: {
            displayedScore: 90,
            currentScore: 80
          },
          validated: false
        },
        {
          label: 'Graph caracteristics listing',
          type: 'progress',
          progress: {
            displayedScore: 60,
            currentScore: 80
          },
          validated: true
        }
      ]
    }
  };

  attempts = [
    {
      ID: 1,
      number: 1,
      progress: {
        displayedScore: 75,
        currentScore: 75
      },
      date: new Date(),
      author: 'Mathieu',
      lang: 'C++'
    },
    {
      ID: 2,
      number: 2,
      progress: {
        displayedScore: 75,
        currentScore: 75
      },
      date: new Date(),
      author: 'Mathieu',
      lang: 'C++'
    },
    {
      ID: 3,
      number: 3,
      progress: {
        displayedScore: 75,
        currentScore: 75
      },
      date: new Date(),
      author: 'Mathieu',
      lang: 'Java'
    },
    {
      ID: 4,
      number: 4,
      progress: {
        displayedScore: 75,
        currentScore: 75
      },
      date: new Date(),
      author: 'Mathieu',
      lang: 'Python'
    },
    {
      ID: 5,
      number: 5,
      progress: {
        displayedScore: 0,
        currentScore: 0
      },
      date: new Date(),
      author: 'Mathieu',
      lang: 'Node.js'
    },
    {
      ID: 6,
      number: 6,
      progress: {
        displayedScore: 75,
        currentScore: 75
      },
      date: new Date(),
      author: 'Mathieu',
      lang: 'Java'
    },
    {
      ID: 7,
      number: 7,
      progress: {
        displayedScore: 75,
        currentScore: 75
      },
      date: new Date(),
      author: 'Mathieu',
      lang: 'Python'
    }
  ];

  selectedAttempt = {};

  selectedAttemptID = -1;

  constructor() { }

  ngOnInit() {
  }

  onCoordEvent(e) {
    console.log(e);
    this.isCoordinator = !this.isCoordinator;
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
