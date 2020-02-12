import { Component, OnInit, ElementRef, OnChanges, SimpleChanges, Input, Output, EventEmitter } from '@angular/core';
import { NodeService } from 'src/app/services/node-service.service';
import { EditService } from 'src/app/services/edit.service';
import { MenuItem } from 'primeng/api/menuitem';

export enum AutoText {
  category = 'category',
  all = 'all',
  all_but_one = 'all_but_one',
  n_problem = 'n_problem'
}

@Component({
  selector: 'app-task-tab',
  templateUrl: './task-tab.component.html',
  styleUrls: ['./task-tab.component.scss']
})
export class TaskTabComponent implements OnInit, OnChanges {

  @Input() activityORSkill = true;
  @Input() autoText = 'category';
  @Input() data;
  @Input() image;
  @Input() editing = false;
  @Input() desc;
  @Input() parentSkills;
  
  @Output() expandWholeWidth = new EventEmitter<void>();

  validationN = false;
  freeze = true;
  enableScoreWeight = false;
  asRow = false;
  showDesc = false;
  compactMode = false;

  columnWidth = 160;
  columnHeight = 70;

  validText;
  trees;
  situationTypes = [
    {
      label: 'log view'
    },
    {
      label: 'chapter view'
    }
  ];
  groupTypes = [
    {
      icon: 'fa fa-users',
      label: 'teams'
    },
    {
      icon: 'fa fa-users',
      label: 'group'
    },
    {
      icon: 'fa fa-user',
      label: 'users'
    }
  ];
  validationType = [
    {
      label: 'Category',
      value: AutoText.category
    },
    {
      label: 'All',
      value: AutoText.all
    },
    {
      label: 'All but one',
      value: AutoText.all_but_one
    },
    {
      label: 'N problems',
      value: AutoText.n_problem
    }
  ];

  chapterdata = [
    {
      ID: 1,
      weight: 2,
      col1: 'video',
      col2: 'Morbi sit amet eleifend tortor',
      type: 0
    },
    {
      ID: 2,
      weight: '2',
      col1: 'video',
      col2: 'Morbi sit amet eleifend tortor',
      type: 1
    },
    {
      ID: 3,
      weight: 2,
      col1: 'conc.',
      col2: 'Morbi sit amet eleifend tortor',
      type: 2
    }
  ];

  chaptercols = ['col1', 'col2'];
  currentUser;
  selectedView = 0;


  logviewdata = [
    {
      potential_icon: 'fa fa-bell',
      date: new Date(2018, 2, 23),
      status: 'Activity started',
      title: 'Stage lorem ipsum',
      score: {
        displayedScore: 75,
        currentScore: 75,
        type: 'score'
      }
    },
    {
      date: new Date(2018, 2, 25),
      status: 'Submissions',
      title: 'Competence Lorem ipsum augmentee',
      score: {
        displayedScore: 63,
        currentScore: 63,
        type: 'progress'
      }
    },
    {
      date: new Date(2018, 2, 23),
      status: 'Ask for clue',
      title: 'Travaux encadres en presentiel',
      score: {
        displayedScore: 75,
        currentScore: 75,
        type: 'score'
      }
    }
  ];

  logviewcols = [
    {
      header: 'Date',
      field: 'date'
    },
    {
      header: 'Type',
      field: 'user'
    },
    {
      header: 'Title',
      field: 'title'
    },
    {
      header: 'Score',
      field: 'score'
    }
  ];

  logviewgroupinfo = [
    {
      name: 'Log view columns',
      columns: this.logviewcols
    }
  ];

  chapterviewdata = [
    {
      title: 'Responds',
      submissions: 1,
      hints: 1,
      last_activity: new Date(),
      time_spent: 30,
      progress: {
        displayedScore: 100,
        currentScore: 100
      }
    },
    {
      title: 'L\'eclipse',
      submissions: 2,
      hints: 2,
      last_activity: new Date(),
      time_spent: 17,
      progress: {
        displayedScore: 100,
        currentScore: 100
      }
    },
    {
      title: 'Bonbons pour tout le monde !',
      submissions: 4,
      hints: 4,
      last_activity: new Date(),
      time_spent: 24,
      progress: {
        displayedScore: 75,
        currentScore: 75
      }
    },
    {
      title: 'Sed consectetur bibendum phareta',
      submissions: 1,
      hints: 1,
      last_activity: new Date(),
      time_spent: 18,
      progress: {
        displayedScore: 0,
        currentScore: 0
      }
    },
    {
      title: 'Sed consectetur bibendum pharetas',
      submissions: 0,
      hints: 0
    },
  ];

  chapterviewcols = [
    { field: 'title', header: 'Title' },
    { field: 'submissions', header: 'Submissions' },
    { field: 'hints', header: 'Hints' },
    { field: 'last_activity', header: 'Last activity' },
    { field: 'time_spent', header: 'Time spent' }
  ];

  chapterviewgroupinfo = [
    {
      name: 'Epreuves',
      columns: this.chapterviewcols
    }
  ];

  gcvd = [
    [
      {
        time_spent: 72000,
        hints: 1,
        clues: 3,
        attempts: 3,
        last_activity: Date.now(),
        progress: {
          displayedScore: 75,
          currentScore: 75,
          isStarted: true,
          isValidated: true
        }
      },
      {
        time_spent: 1235,
        hints: 1,
        clues: 3,
        attempts: 3,
        last_activity: Date.now(),
        progress: {
          displayedScore: 75,
          currentScore: 75,
          isStarted: true,
          isValidated: true
        }
      },
      {
        time_spent: 454000,
        hints: 1,
        clues: 3,
        attempts: 3,
        last_activity: Date.now(),
        progress: {
          displayedScore: 75,
          currentScore: 75,
          isStarted: true,
          isValidated: true
        }
      },
      {
        time_spent: 54,
        hints: 1,
        clues: 3,
        attempts: 3,
        last_activity: Date.now(),
        progress: {
          displayedScore: 75,
          currentScore: 75,
          isStarted: false,
          isValidated: false
        }
      },
      {
        time_spent: 54,
        hints: 1,
        clues: 3,
        attempts: 3,
        last_activity: Date.now(),
        progress: {
          displayedScore: 75,
          currentScore: 75,
          isStarted: true,
          isValidated: true
        }
      }
    ],
    [
      {
        time_spent: 54,
        hints: 1,
        clues: 3,
        attempts: 3,
        last_activity: Date.now(),
        progress: {
          displayedScore: 75,
          currentScore: 75,
          isStarted: true,
          isValidated: true
        }
      },
      {
        time_spent: 54,
        hints: 1,
        clues: 3,
        attempts: 3,
        last_activity: Date.now(),
        progress: {
          displayedScore: 75,
          currentScore: 75,
          isStarted: true,
          isValidated: true
        }
      },
      {
        time_spent: 54,
        hints: 1,
        clues: 3,
        attempts: 3,
        last_activity: Date.now(),
        progress: {
          displayedScore: 75,
          currentScore: 75,
          isStarted: true,
          isValidated: true
        }
      },
      {
        time_spent: 54,
        hints: 1,
        clues: 3,
        attempts: 3,
        last_activity: Date.now(),
        progress: {
          displayedScore: 75,
          currentScore: 75,
          isStarted: true,
          isValidated: true
        }
      },
      {
        time_spent: 54,
        hints: 1,
        clues: 3,
        attempts: 3,
        last_activity: Date.now(),
        progress: {
          displayedScore: 75,
          currentScore: 75,
          isStarted: true,
          isValidated: true
        }
      },
    ],
    [
      {
        time_spent: 1235,
        hints: 1,
        clues: 3,
        attempts: 3,
        last_activity: Date.now(),
        progress: {
          displayedScore: 75,
          currentScore: 75,
          isStarted: true,
          isValidated: true
        }
      },
      {
        time_spent: 54,
        hints: 1,
        clues: 3,
        attempts: 3,
        last_activity: Date.now(),
        progress: {
          displayedScore: 75,
          currentScore: 75,
          isStarted: true,
          isValidated: true
        }
      },
      {
        time_spent: 54,
        hints: 1,
        clues: 3,
        attempts: 3,
        last_activity: Date.now(),
        progress: {
          displayedScore: 75,
          currentScore: 75,
          isStarted: true,
          isValidated: true
        }
      },
      {
        time_spent: 54,
        hints: 1,
        clues: 3,
        attempts: 3,
        last_activity: Date.now(),
        progress: {
          displayedScore: 75,
          currentScore: 75,
          isStarted: true,
          isValidated: true
        }
      },
      {
        time_spent: 54,
        hints: 1,
        clues: 3,
        attempts: 3,
        last_activity: Date.now(),
        progress: {
          displayedScore: 75,
          currentScore: 75,
          isStarted: true,
          isValidated: true
        }
      },
    ],
    [
      {
        time_spent: 54,
        hints: 1,
        clues: 3,
        attempts: 3,
        last_activity: Date.now(),
        progress: {
          displayedScore: 75,
          currentScore: 75,
          isStarted: true,
          isValidated: true
        }
      },
      {
        time_spent: 54,
        hints: 1,
        clues: 3,
        attempts: 3,
        last_activity: Date.now(),
        progress: {
          displayedScore: 75,
          currentScore: 75,
          isStarted: true,
          isValidated: true
        }
      },
      {
        time_spent: 54,
        hints: 1,
        clues: 3,
        attempts: 3,
        last_activity: Date.now(),
        progress: {
          displayedScore: 75,
          currentScore: 75,
          isStarted: true,
          isValidated: true
        }
      },
      {
        time_spent: 54,
        hints: 1,
        clues: 3,
        attempts: 3,
        last_activity: Date.now(),
        progress: {
          displayedScore: 75,
          currentScore: 75,
          isStarted: true,
          isValidated: true
        }
      },
      {
        time_spent: 54,
        hints: 1,
        clues: 3,
        attempts: 3,
        last_activity: Date.now(),
        progress: {
          displayedScore: 75,
          currentScore: 75,
          isStarted: true,
          isValidated: true
        }
      },
    ],
    [
      {
        time_spent: 54,
        hints: 1,
        clues: 3,
        attempts: 3,
        last_activity: Date.now(),
        progress: {
          displayedScore: 75,
          currentScore: 0,
          isStarted: true,
          isValidated: true
        }
      },
      {
        time_spent: 54,
        hints: 1,
        clues: 3,
        attempts: 3,
        last_activity: Date.now(),
        progress: {
          displayedScore: 75,
          currentScore: 75,
          isStarted: true,
          isValidated: true
        }
      },
      {
        time_spent: 54,
        hints: 1,
        clues: 3,
        attempts: 3,
        last_activity: Date.now(),
        progress: {
          displayedScore: 75,
          currentScore: 75,
          isStarted: true,
          isValidated: true
        }
      },
      {
        time_spent: 54,
        hints: 1,
        clues: 3,
        attempts: 3,
        last_activity: Date.now(),
        progress: {
          displayedScore: 75,
          currentScore: 75,
          isStarted: true,
          isValidated: true
        }
      },
      {
        time_spent: 54,
        hints: 1,
        clues: 3,
        attempts: 3,
        last_activity: Date.now(),
        progress: {
          displayedScore: 75,
          currentScore: 100,
          isStarted: true,
          isValidated: true,
        }
      },
    ],
    [
      {
        time_spent: 54,
        hints: 1,
        clues: 3,
        attempts: 3,
        last_activity: Date.now(),
        progress: {
          displayedScore: 75,
          currentScore: 75,
          isStarted: false,
          isValidated: true
        }
      },
      {
        time_spent: 54,
        hints: 1,
        clues: 3,
        attempts: 3,
        last_activity: Date.now(),
        progress: {
          displayedScore: 75,
          currentScore: 75,
          isStarted: true,
          isValidated: true
        }
      },
      {
        time_spent: 54,
        hints: 1,
        clues: 3,
        attempts: 3,
        last_activity: Date.now(),
        progress: {
          displayedScore: 75,
          currentScore: 75,
          isStarted: true,
          isValidated: true
        }
      },
      {
        time_spent: 54,
        hints: 1,
        clues: 3,
        attempts: 3,
        last_activity: Date.now(),
        progress: {
          displayedScore: 75,
          currentScore: 75,
          isStarted: true,
          isValidated: true
        }
      },
      {
        time_spent: 54,
        hints: 1,
        clues: 3,
        attempts: 3,
        last_activity: Date.now(),
        progress: {
          displayedScore: 75,
          currentScore: 75,
          isStarted: true,
          isValidated: true
        }
      },
    ]
  ];

  gcvc = [
    'Column 1',
    'Column 2',
    'Column 3',
    'Column 4',
    'Column 5',
  ];

  gcvr = [
    'Row 1',
    'Row 2',
    'Row 3',
    'Row 4',
    'Row 5',
    'Row 6'
  ];

  cmenu: MenuItem[];

  vertical = false;

  constructor(
    private elementRef: ElementRef,
    private nodeService: NodeService,
    private editService: EditService
  ) { }

  refresh() {
    switch (this.autoText) {
      case 'category':
        this.validText = 'solve at least all tasks with Validation type';
        break;
      case 'all':
        this.validText = 'solve all the tasks';
        break;
      case 'all_but_one':
        this.validText = 'solve all the tasks except maybe one';
        break;
      default:
        this.validText = `solve at least ${this.autoText} tasks`;
        break;
    }
  }

  ngOnInit() {
    this.refresh();
    this.nodeService.getFiles().then(res => {
      this.trees = res;
      console.log(this.trees);
    });
    this.editService.getUserOb().subscribe(res => {
      this.currentUser = res;
    });
    this.cmenu = [
        {
            label: 'File',
            items: [{
                    label: 'New', 
                    icon: 'pi pi-fw pi-plus',
                    items: [
                        {label: 'Project'},
                        {label: 'Other'},
                    ]
                },
                {label: 'Open'},
                {label: 'Quit'}
            ]
        },
        {
            label: 'Edit',
            icon: 'pi pi-fw pi-pencil',
            items: [
                {label: 'Delete', icon: 'pi pi-fw pi-trash'},
                {label: 'Refresh', icon: 'pi pi-fw pi-refresh'}
            ]
        }
    ];
  }

  ngOnChanges(changes: SimpleChanges) {
    this.refresh();
  }

  onTabChange(e) {
    const tabs = this.elementRef.nativeElement.querySelectorAll('.mat-tab-labels .mat-tab-label');
    let i;
    const activeTab = this.elementRef.nativeElement.querySelector('.mat-tab-labels .mat-tab-label.mat-tab-label-active');
    tabs.forEach((tab) => {
      tab.classList.remove('mat-tab-label-before-active');
    });

    for (i = 0 ; i < tabs.length ; i++) {
      if (tabs[i] === activeTab) {
        break;
      }
    }

    if (i > 0) {
      tabs[i - 1].classList.add('mat-tab-label-before-active');
    }
  }

  viewTypeChanged(idx) {
    this.selectedView = idx;
    if (idx === 0) {  // Log View
      console.log("Log View");
    } else {          // Chapter View
      console.log("Chapter View");
    }
  }

  onSwapColRow(e) {
    const cont = this.gcvc;
    this.gcvc = this.gcvr;
    this.gcvr = cont;
    this.gcvd = this.gcvd[0].map((col, i) => this.gcvd.map(row => row[i]));
    this.asRow = !this.asRow;
  }

  onModeChange(e) {
    this.compactMode = !this.compactMode;
    this.columnWidth = this.compactMode ? 60 : 160;
    this.columnHeight = this.compactMode ? 50 : 70;
  }

  onProgressShowChange(e) {
    this.vertical = !this.vertical;
  }

  onExpandWidth(e) {
    this.expandWholeWidth.emit(e);
  }

  onFrozenChange(e) {
    this.freeze = e;
  }

  validationChanged(e) {
    console.log(e);
    if (e.value === 'n_problem') {
      this.validationN = true;
    } else {
      this.validationN = false;
    }
  }

  toggleScoreWeight(e) {
    this.enableScoreWeight = !this.enableScoreWeight;
  }

  onShowDescription(e) {
    this.showDesc = !this.showDesc;
  }

}
