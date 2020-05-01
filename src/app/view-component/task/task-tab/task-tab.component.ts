import {
  Component,
  OnInit,
  ElementRef,
  OnChanges,
  SimpleChanges,
  Input,
  Output,
  EventEmitter
} from "@angular/core";
import { NodeService } from "src/app/services/node-service.service";
import { EditService } from "src/app/services/edit.service";
import { MenuItem } from "primeng/api/menuitem";
import { ViewportScroller } from "@angular/common";
import { MatDialog } from '@angular/material';
import { AccessEditDialogComponent } from 'core';

export enum AutoText {
  category = "category",
  all = "all",
  all_but_one = "all_but_one",
  n_problem = "n_problem"
}

@Component({
  selector: "app-task-tab",
  templateUrl: "./task-tab.component.html",
  styleUrls: ["./task-tab.component.scss"]
})
export class TaskTabComponent implements OnInit, OnChanges {
  @Input() activityORSkill = true;
  @Input() autoText = "category";
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
  gridSelect = false;
  columnWidth = 13.3333;
  columnHeight = 70;

  validText;
  trees;
  situationTypes = [
    {
      label: "log view"
    },
    {
      label: "chapter view"
    }
  ];
  groupTypes = [
    {
      icon: "fa fa-users",
      label: "teams"
    },
    {
      icon: "fa fa-users",
      label: "group"
    },
    {
      icon: "fa fa-user",
      label: "users"
    }
  ];
  validationType = [
    {
      label: "Category",
      value: AutoText.category
    },
    {
      label: "All",
      value: AutoText.all
    },
    {
      label: "All but one",
      value: AutoText.all_but_one
    },
    {
      label: "N problems",
      value: AutoText.n_problem
    }
  ];

  chapterdata = [
    {
      ID: 1,
      weight: 2,
      col1: "video",
      col2: "Morbi sit amet eleifend tortor",
      type: 0
    },
    {
      ID: 2,
      weight: "2",
      col1: "video",
      col2: "Morbi sit amet eleifend tortor",
      type: 1
    },
    {
      ID: 3,
      weight: 2,
      col1: "conc.",
      col2: "Morbi sit amet eleifend tortor",
      type: 2
    }
  ];

  chaptercols = ["col1", "col2"];
  currentUser;
  selectedView = 0;

  logviewdata = [
    {
      potential_icon: "fa fa-bell",
      date: new Date(2018, 2, 23),
      status: "Activity started",
      title: "Stage lorem ipsum",
      score: {
        displayedScore: 75,
        currentScore: 75,
        type: "score"
      }
    },
    {
      date: new Date(2018, 2, 25),
      status: "Submissions",
      title: "Competence Lorem ipsum augmentee",
      score: {
        displayedScore: 63,
        currentScore: 63,
        type: "progress"
      }
    },
    {
      date: new Date(2018, 2, 23),
      status: "Ask for clue",
      title: "Travaux encadres en presentiel",
      score: {
        displayedScore: 75,
        currentScore: 75,
        type: "score"
      }
    }
  ];

  logviewcols = [
    {
      header: "Date",
      field: "date"
    },
    {
      header: "Type",
      field: "user"
    },
    {
      header: "Title",
      field: "title"
    },
    {
      header: "Score",
      field: "score"
    }
  ];

  logviewgroupinfo = [
    {
      name: "Log view columns",
      columns: this.logviewcols
    }
  ];

  chapterviewdata = [
    {
      title: "Responds",
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
      title: "L'eclipse",
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
      title: "Bonbons pour tout le monde !",
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
      title: "Sed consectetur bibendum phareta",
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
      title: "Sed consectetur bibendum pharetas",
      submissions: 0,
      hints: 0
    }
  ];

  chapterviewcols = [
    { field: "title", header: "Title" },
    { field: "submissions", header: "Submissions" },
    { field: "hints", header: "Hints" },
    { field: "last_activity", header: "Last activity" },
    { field: "time_spent", header: "Time spent" }
  ];

  chapterviewgroupinfo = [
    {
      name: "Epreuves",
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
          displayedScore: 0,
          currentScore: 0,
          isStarted: true,
          isValidated: false,
          isFailed: true
        }
      },
      {
        time_spent: 1235,
        hints: 1,
        clues: 3,
        attempts: 3,
        last_activity: Date.now(),
        progress: {
          displayedScore: 100,
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
          displayedScore: 0,
          currentScore: 0,
          isStarted: true,
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
      }
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
      }
    ]
  ];

  gcvc = ["Column 1", "Column 2", "Column 3", "Column 4", "Column 5"];

  gcvr = ["Row 1", "Row 2", "Row 3", "Row 4", "Row 5", "Row 6"];

  cmenu: MenuItem[];

  vertical = false;

  preqs = [
    {
      title: "Graphs: methods",
      progress: {
        displayedScore: 20,
        currentScore: 20
      }
    },
    {
      title: "Graphs caracteristics listing",
      progress: {
        displayedScore: 30,
        currentScore: 30
      }
    },
    {
      title: "Reduce size of a graph",
      progress: {
        displayedScore: 30,
        currentScore: 30
      }
    }
  ];

  sessionFilters = [
    {
      ID: 1,
      icon: "fa fa-map-marker",
      label: "Paris",
      type: "standard",
      mode: "basic",
      text: "Location selection"
    },
    {
      ID: 2,
      icon: "fa fa-user",
      label: "Cyril",
      type: "standard",
      mode: "basic",
      text: "User selection"
    },
    {
      ID: 3,
      icon: "fa fa-calendar",
      label: "24/03/2019",
      type: "standard",
      mode: "basic",
      text: "Date selection"
    }
  ];

  gridFilters = [
    {
      ID: 1,
      icon: "fa fa-flag-checkered",
      label: "Those who started",
      type: "default",
      mode: "list",
      list: [
        { label: "Item 1", value: { id: 1, value: "item1" } },
        { label: "Item 2", value: { id: 2, value: "item2" } },
        { label: "Item 3", value: { id: 3, value: "item3" } },
        { label: "Item 4", value: { id: 4, value: "item4" } },
        { label: "Item 5", value: { id: 5, value: "item5" } },
        { label: "Item 6", value: { id: 6, value: "item6" } },
        { label: "Item 7", value: { id: 7, value: "item7" } },
        { label: "Item 8", value: { id: 8, value: "item8" } },
        { label: "Item 9", value: { id: 9, value: "item9" } }
      ]
    },
    {
      ID: 2,
      icon: "fa fa-eye",
      label: "Another filter",
      type: "standard",
      mode: "basic",
      text:
        "Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged."
    },
    {
      ID: 3,
      icon: "fa fa-hand-paper",
      label: "Filter 2",
      type: "standard",
      mode: "dates",
      dateRanges: [new Date(), new Date()]
    },
    {
      ID: 4,
      icon: "fa fa-hand-paper",
      label: "Score",
      type: "standard",
      mode: "activity",
      ranges: [30, 72]
    }
  ];

  ranges = [0, 20];

  filterChoice = [
    "Select a filter",
    "Range of date",
    "Location",
    "Score range"
  ];

  sessionData = [
    {
      title: "Stage Lorem ipsum",
      activity_name: "Activity title",
      chapter_picture: "barca.jpeg",
      text:
        "Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged.",
      author: "Jean-Claude MONNET",
      author_picture: "",
      location: "Paris",
      date: new Date(),
      spots: {
        available: 200,
        remaining: 153
      }
    },
    {
      title: "Stage Lorem ipsum",
      activity_name: "Activity title",
      chapter_picture: "barca.jpeg",
      text:
        "Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged.",
      author: "Jean-Claude MONNET",
      author_picture: "_messi.jpg",
      location: "Paris",
      date: new Date(),
      spots: {
        available: 200,
        remaining: 153
      }
    },
    {
      title: "Stage Lorem ipsum",
      activity_name: "Activity title",
      chapter_picture: "barca.jpeg",
      text:
        "Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged.",
      author: "Jean-Claude MONNET",
      author_picture: "_messi.jpg",
      location: "Paris",
      date: new Date(),
      spots: {
        available: 200,
        remaining: 153
      }
    }
  ];

  mosaicData = [
    {
      ID: 1,
      title: "Activity with access code",
      type: "leaf",
      image: "france.jpg",
      ring: true,
      state: "opened",
      weight: 2,
      hasKey: true,
      progress: {
        displayedScore: 30,
        currentScore: 30
      },
      category: {
        icon: "fa fa-book-open",
        type: 4
      }
    },
    {
      ID: 2,
      title: "Before you start notice",
      type: "leaf",
      image: "barca.jpeg",
      ring: true,
      state: "opened",
      weight: 2,
      hasKey: true,
      progress: {
        displayedScore: 20,
        currentScore: 30
      },
      category: {
        icon: "fa fa-book-open",
        type: 2
      }
    },
    {
      ID: 3,
      title: "Activity for teams",
      type: "leaf",
      image: "france.jpg",
      ring: true,
      state: "opened",
      weight: 2,
      hasKey: true,
      progress: {
        displayedScore: 90,
        currentScore: 30
      },
      category: {
        icon: "fa fa-book-open",
        type: 1
      }
    },
    {
      ID: 4,
      title: "Activity with attempts",
      type: "leaf",
      image: "barca.jpeg",
      ring: true,
      state: "opened",
      weight: -1,
      hasKey: true,
      progress: {
        displayedScore: 10,
        currentScore: 30
      },
      category: {
        icon: "fa fa-book-open",
        type: 4
      }
    },
    {
      ID: 5,
      title: "Activity with attempts",
      type: "leaf",
      image: "france.jpg",
      ring: true,
      state: "opened",
      weight: 4,
      hasKey: true,
      progress: {
        displayedScore: 10,
        currentScore: 30
      },
      category: {
        icon: "fa fa-book-open",
        type: 3
      }
    },
    {
      ID: 6,
      title:
        "Activity with attempts very very very very very very very very very very very very very very long text",
      type: "leaf",
      image: "france.jpg",
      ring: true,
      state: "opened",
      weight: 3,
      hasKey: true,
      progress: {
        displayedScore: 10,
        currentScore: 30
      },
      category: {
        icon: "fa fa-book-open",
        type: 2
      }
    }
  ];

  showNewContent = false;

  contentTypes = [
    {
      image: "france.jpg",
      icon: "fa fa-list",
      title: "Multiple choice",
      desc:
        "Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book."
    },
    {
      image: "france.jpg",
      icon: "fa fa-play",
      title: "Video",
      desc:
        "Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book."
    },
    {
      image: "france.jpg",
      icon: "fa fa-trophy",
      title: "Html presentation",
      desc:
        "Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book."
    },
    {
      image: "france.jpg",
      icon: "fa fa-trophy",
      title: "Free answer",
      desc:
        "Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book."
    },
    {
      image: "france.jpg",
      icon: "fa fa-trophy",
      title: "Programmation",
      desc:
        "Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book."
    },
    {
      image: "france.jpg",
      icon: "fa fa-play",
      title: "Algorea subject",
      desc:
        "Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book."
    }
  ];

  editTreeData;

  contentValue = "";

  scrolled = false;
  added = false;

  selectedTab = 0;

  constructor(
    private elementRef: ElementRef,
    private nodeService: NodeService,
    private editService: EditService,
    private vps: ViewportScroller,
    private dialog: MatDialog
  ) {}

  refresh() {
    switch (this.autoText) {
      case "category":
        this.validText = "solve at least all tasks with Validation type";
        break;
      case "all":
        this.validText = "solve all the tasks";
        break;
      case "all_but_one":
        this.validText = "solve all the tasks except maybe one";
        break;
      default:
        this.validText = `solve at least ${this.autoText} tasks`;
        break;
    }

    this.editTreeData = [
      this.data
    ];


  }

  ngOnInit() {
    this.refresh();
    this.nodeService.getFiles().then(res => {
      this.trees = res;
    });
    this.editService.getUserOb().subscribe(res => {
      this.currentUser = res;
    });
    this.cmenu = [
      {
        label: "File",
        items: [
          {
            label: "New",
            icon: "pi pi-fw pi-plus",
            items: [{ label: "Project" }, { label: "Other" }]
          },
          { label: "Open" },
          { label: "Quit" }
        ]
      },
      {
        label: "Edit",
        icon: "pi pi-fw pi-pencil",
        items: [
          { label: "Delete", icon: "pi pi-fw pi-trash" },
          { label: "Refresh", icon: "pi pi-fw pi-refresh" }
        ]
      }
    ];
  }

  ngOnChanges(changes: SimpleChanges) {
    this.refresh();
    if (changes.activityORSkill && changes.activityORSkill.previousValue !== changes.activityORSkill.currentValue) {
      this.selectedTab = 0;
    }
  }

  onTabChange(e) {
    const tabs = this.elementRef.nativeElement.querySelectorAll(
      ".mat-tab-labels .mat-tab-label"
    );
    let i;
    const activeTab = this.elementRef.nativeElement.querySelector(
      ".mat-tab-labels .mat-tab-label.mat-tab-label-active"
    );
    tabs.forEach(tab => {
      tab.classList.remove("mat-tab-label-before-active");
    });

    for (i = 0; i < tabs.length; i++) {
      if (tabs[i] === activeTab) {
        break;
      }
    }

    if (i > 0) {
      tabs[i - 1].classList.add("mat-tab-label-before-active");
    }
  }

  viewTypeChanged(idx) {
    this.selectedView = idx;
    if (idx === 0) {
      // Log View
      console.log("Log View");
    } else {
      // Chapter View
      console.log("Chapter View");
    }
  }

  onSwapColRow(e) {
    const cont = this.gcvc;
    this.gcvc = this.gcvr;
    this.gcvr = cont;
    this.gcvd = this.gcvd[0].map((col, i) => this.gcvd.map(row => row[i]));
    console.log("Hey, I am called");
    this.asRow = !this.asRow;
  }

  onModeChange(e) {
    this.compactMode = !this.compactMode;
    this.columnWidth = this.compactMode ? 5 : 13.3333;
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
    if (e.value === "n_problem") {
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

  removeFilter(id) {
    this.gridFilters = this.gridFilters.filter(el => {
      return el.ID !== id;
    });
  }

  onAddContent(e, id) {
    if (e.length > 0) {
      this.showNewContent = true;
      this.contentValue = e;
      setTimeout(() => {
        if (!this.scrolled && !this.added) {
          let [x, y] = this.vps.getScrollPosition();
          this.vps.scrollToPosition([x, y + 50]);
          this.added = true;
        }
        this.scrolled = true;
      }, 0);
    } else {
      this.showNewContent = false;
      this.scrolled = false;
      this.added = false;
    }
  }

  onCancelEdit(e) {
    this.showNewContent = false;
    this.contentValue = "";
  }

  onConfigureAccess(e) {
    const ref = this.dialog.open(AccessEditDialogComponent, {
      maxHeight: "83rem",
      minWidth: "67rem",
      maxWidth: "67rem",
      minHeight: "25rem",
      data: {
        icon: "fa fa-lock",
        label: `Item 1: access given to Terminale B`,
        comment:
          "Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged.",
        sections: [
          {
            header: {
              icon: "fa fa-eye",
              title: "Can view"
            },
            progress: true,
            values: [
              {
                field: "none",
                label: 'Nothing',
                comment: "Item is invisible to the user"
              },
              {
                field: "info",
                label: "Info",
                comment: "User(s) can see the item title and description, but not its content"
              },
              {
                field: "content",
                label: "Content",
                comment: "User(s) can see the content of this item"
              },
              {
                field: "content_with_descendants",
                label: "Content and descendants",
                comment: "User(s) can also see the content of this items descendants (when possible for this group)"
              },
              {
                field: "solution",
                label: "Solution",
                comment: "User(s) can also see the solution of this items and its descendants (when possible for this group)"
              }
            ],
            name: 'can_view',
            active_until: 2
          },
          {
            header: {
              icon: "fa fa-door-open",
              title: "Can enter"
            },
            progress: false,
            label: "User(s) may enter this item (a contest or time-limited chapter)",
            name: 'can_enter_from',
            checked: false,
            start_from: new Date(),
            until: new Date(),
            until_name: 'can_enter_until',
            until_checkd: false
          },
          {
            header: {
              icon: "fa fa-key",
              title: "Can grant view"
            },
            progress: true,
            values: [
              {
                field: "none",
                label: 'Nothing',
                comment: "User(s) can't grant any access to this item"
              },
              {
                field: "enter",
                label: "Info & enter",
                comment: "User(s) can grant \"Can view: info\" and  \"Can enter\" access"
              },
              {
                field: "content",
                label: "Content",
                comment: "User(s) can also grant \"Can view: content\" access"
              },
              {
                field: "content_with_descendants",
                label: "Content and descendants",
                comment: "User(s) can also grant \"Can view: content and descendants\" access"
              },
              {
                field: "solution",
                label: "Solution",
                comment: "User(s) can also grant \"Can view: solution\" access",
                disabled: true
              },
              {
                field: "solution_with_grant",
                label: "Solution and grant",
                comment: "User(s) can also grant \"Can grant view\" access",
                disabled: true
              }
            ],
            name: 'can_grant_view',
            active_until: 2
          },
          {
            header: {
              icon: "fa fa-binoculars",
              title: "Can watch"
            },
            progress: true,
            values: [
              {
                field: "none",
                label: 'Nothing',
                comment: "User(s) can't watch the activity of others on this item"
              },
              {
                field: "result",
                label: "Result",
                comment: "User(s) can view information about submissions and scores of others on this item, but not their answers"
              },
              {
                field: "answer",
                label: "Answer",
                comment: "User(s) can also look at other people's answers on this item"
              },
              {
                field: "answer_with_grant",
                label: "Answer and grant",
                comment: "User(s) can also grant \"Can watch\" access to others"
              }
            ],
            name: 'can_watch',
            active_until: 2
          },
          {
            header: {
              icon: "fa fa-pencil-alt",
              title: "Can edit"
            },
            progress: true,
            values: [
              {
                field: "none",
                label: 'Nothing',
                comment: "User(s) can't make any changes to this item"
              },
              {
                field: "children",
                label: "Children",
                comment: "User(s) can add children to this item and edit how permissions propagate to them"
              },
              {
                field: "all",
                label: "All",
                comment: "User(s) can also edit the content of the item itself, but may not delete it"
              },
              {
                field: "all_with_grant",
                label: "All and grant",
                comment: "User(s) can also give \"Can edit\" access to others"
              }
            ],
            name: 'can_edit',
            active_until: 2
          },
          {
            header: {
              icon: "fa fa-paperclip",
              title: "Can attach official sessions"
            },
            progress: false,
            label: "User(s) may attach official sessions to this item, that will be visible to everyone in the content tab of the item",
            name: "can_make_session_official",
            checked: false
          },
          {
            header: {
              icon: "fa fa-user-tie",
              title: "Is owner"
            },
            progress: false,
            label:
              "User(s) own this item, and get the maximum access in all categories above, and may also delete this item",
            name: 'is_owner',
            checked: false
          }
        ]
      }
    });

    ref.afterClosed().subscribe(result => {
      console.log(`Attach Group dialog result ${result}`);
    });
  }
}
