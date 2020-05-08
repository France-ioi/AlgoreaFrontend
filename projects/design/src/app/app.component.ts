import { Component, HostListener } from "@angular/core";
import { NodeService } from "./services/node-service.service";
import * as _ from "lodash";
import { Router } from "@angular/router";
import { EditService } from "./services/edit.service";
import { ProgressType } from 'core';

@Component({
  selector: "app-root",
  templateUrl: "./app.component.html",
  styleUrls: ["./app.component.scss"]
})
export class AppComponent {
  ProgressType = ProgressType;
  title = "algorea";
  editing = false;
  curScore = 70;
  dispScore = 65;
  isStarted = true;

  langs = [
    'English',
    'Francais',
    'Espanol',
    'Czech',
    'Deutsch'
  ];

  // Tree Data

  files;
  groups;
  trees;

  allowFullScreen = false;

  breaddata = {
    selectedID: 42,
    path: [
      { ID: 1, label: "Contest", separator: "slash" },
      {
        ID: 42,
        label: "Personalized contest",
        attempt: 12,
        separator: "arrow"
      },
      { ID: 43, label: "Personalized contests", attempt: 12 },
      { ID: 23, label: "IOI Selection 2012", attempt: 2 },
      { ID: 24, label: "Individuals", separator: "slash" }
    ]
  };

  breadhome = {
    selectedID: -1,
    path: [
      { ID: 1, label: "Home" }
    ]
  }

  groupdata = {
    selectedID: 1, // User selected ID
    currentID: 1, // Current User ID
    users: [
      {
        ID: 1,
        title: "Lionel MESSI",
        avatar: "_messi.jpg",
        type: "user"
      },
      {
        ID: 2,
        title: "Suarez",
        type: "user"
      },
      {
        ID: 3,
        title: "FC Barcelona",
        type: "group"
      }
    ],
    groups: {
      manage: [
        {
          ID: 1,
          title: "Big root",
          type: "folder",
          icons: "fa fa-home",
          children: [
            {
              ID: 2,
              title: "Big root1",
              type: "folder",
              progress: {
                currentScore: 50,
                displayedScore: 30
              },
              children: [
                {
                  ID: 3,
                  title: "Documents",
                  icons: "fa fa-folder",
                  type: "folder",
                  children: [
                    {
                      ID: 4,
                      title: "Work",
                      type: "folder",
                      children: [
                        {
                          title: "Expenses.doc",
                          type: "leaf"
                        },
                        {
                          title: "Resume.doc",
                          type: "leaf"
                        }
                      ]
                    },
                    {
                      ID: 5,
                      title: "Resume.doc",
                      type: "leaf"
                    },
                    {
                      ID: 6,
                      title: "Home",
                      type: "folder",
                      children: [
                        {
                          ID: 7,
                          title: "Invoices.txt",
                          type: "leaf"
                        },
                        {
                          ID: 8,
                          title: "Work",
                          type: "folder",
                          children: [
                            {
                              ID: 9,
                              title: "Expenses.doc",
                              type: "leaf"
                            },
                            {
                              ID: 10,
                              title: "Resume.doc",
                              type: "leaf"
                            }
                          ]
                        }
                      ]
                    }
                  ]
                },
                {
                  ID: 16,
                  title: "Pictures",
                  type: "folder",
                  children: [
                    {
                      ID: 11,
                      title: "barcelona.jpg",
                      type: "leaf"
                    },
                    {
                      ID: 12,
                      title: "logo.jpg",
                      type: "leaf"
                    },
                    {
                      ID: 13,
                      title: "primeui.png",
                      type: "leaf"
                    }
                  ]
                },
                {
                  ID: 14,
                  title: "Movies",
                  type: "folder",
                  children: [
                    {
                      ID: 15,
                      title: "Al Pacino",
                      type: "folder",
                      children: [
                        {
                          ID: 17,
                          title: "Scarface",
                          type: "leaf"
                        },
                        {
                          ID: 18,
                          title: "Serpico",
                          type: "leaf"
                        }
                      ]
                    },
                    {
                      ID: 19,
                      title: "Robert De Niro",
                      type: "folder",
                      children: [
                        {
                          ID: 20,
                          title: "Goodfellas",
                          type: "leaf"
                        },
                        {
                          ID: 21,
                          title: "Untouchables",
                          type: "leaf"
                        }
                      ]
                    }
                  ]
                }
              ]
            }
          ]
        },
        {
          ID: 22,
          title: "Groups with requests",
          type: "folder",
          icons: "fa fa-home",
          children: [
            {
              ID: 43,
              title: "Group with grading requests",
              type: "leaf",
              ring: true,
              state: "opened",
              hasKey: true,
              progress: {
                displayedScore: 50,
                currentScore: 30
              },
              category: {
                icon: "fa fa-book-open",
                type: 1
              }
            },
            {
              ID: 44,
              title: "Groups as teams",
              type: "leaf",
              ring: true,
              state: "opened",
              hasKey: true,
              progress: {
                displayedScore: 50,
                currentScore: 30
              },
              category: {
                icon: "fa fa-book-open",
                type: 1
              }
            }
          ]
        }
      ],
      join: [
        {
          title: "Big root",
          type: "folder",
          icons: "fa fa-home",
          children: [
            {
              title: "Big root1",
              type: "folder",
              progress: {
                currentScore: 50,
                displayedScore: 30
              },
              children: [
                {
                  title: "Documents",
                  icons: "fa fa-folder",
                  type: "folder",
                  children: [
                    {
                      title: "Work",
                      type: "folder",
                      children: [
                        {
                          title: "Expenses.doc",
                          type: "leaf"
                        },
                        {
                          title: "Resume.doc",
                          type: "leaf"
                        }
                      ]
                    },
                    {
                      title: "Resume.doc",
                      type: "leaf"
                    },
                    {
                      title: "Home",
                      type: "folder",
                      children: [
                        {
                          title: "Invoices.txt",
                          type: "leaf"
                        },
                        {
                          title: "Work",
                          type: "folder",
                          children: [
                            {
                              title: "Expenses.doc",
                              type: "leaf"
                            },
                            {
                              title: "Resume.doc",
                              type: "leaf"
                            }
                          ]
                        }
                      ]
                    }
                  ]
                },
                {
                  title: "Pictures",
                  type: "folder",
                  children: [
                    {
                      title: "barcelona.jpg",
                      type: "leaf"
                    },
                    {
                      title: "logo.jpg",
                      type: "leaf"
                    },
                    {
                      title: "primeui.png",
                      type: "leaf"
                    }
                  ]
                },
                {
                  title: "Movies",
                  type: "folder",
                  children: [
                    {
                      title: "Al Pacino",
                      type: "folder",
                      children: [
                        {
                          title: "Scarface",
                          type: "leaf"
                        },
                        {
                          title: "Serpico",
                          type: "leaf"
                        }
                      ]
                    },
                    {
                      title: "Robert De Niro",
                      type: "folder",
                      children: [
                        {
                          title: "Goodfellas",
                          type: "leaf"
                        },
                        {
                          title: "Untouchables",
                          type: "leaf"
                        }
                      ]
                    }
                  ]
                }
              ]
            },
            {
              ID: 45,
              title: "Reminder of rights given to manager",
              type: "leaf",
              ring: true,
              state: "opened",
              hasKey: true,
              progress: {
                displayedScore: 50,
                currentScore: 30
              },
              category: {
                icon: "fa fa-book-open",
                type: 1
              }
            }
          ]
        }
      ]
    },
    skills: {
      title: "Algorithmic skills",
      data: [
        {
          ID: 12,
          title: "Graphs: methods",
          type: "leaf",
          ring: false,
          state: "started",
          progress: {
            displayedScore: 100,
            currentScore: 100
          }
        },
        {
          ID: 13,
          title: "List graph caracteristics",
          type: "leaf",
          ring: false,
          state: "never opened",
          progress: {
            displayedScore: 0,
            currentScore: 0
          }
        },
        {
          ID: 14,
          title: "Reduce graph size",
          type: "folder",
          ring: false,
          state: "opened",
          progress: {
            displayedScore: 90,
            currentScore: 90
          },
          children: [
            {
              ID: 15,
              title: "Simplify or optimize manipulation",
              icon: "progress",
              type: "leaf",
              ring: false,
              state: "opened",
              progress: {
                displayedScore: 30,
                currentScore: 30
              }
            },
            {
              ID: 16,
              title: "Spot symetry an convert to normal form",
              icon: "regress",
              type: "folder",
              ring: false,
              state: "opened",
              progress: {
                displayedScore: 70,
                currentScore: 70
              },
              children: [
                {
                  ID: 17,
                  title: "Simplify or optimize manipulation",
                  icon: "stagnant",
                  type: "leaf",
                  ring: false,
                  state: "opened",
                  progress: {
                    displayedScore: 30,
                    currentScore: 30
                  }
                },
                {
                  ID: 18,
                  title: "Spot symetry an convert to normal form",
                  type: "leaf",
                  ring: false,
                  state: "opened",
                  progress: {
                    displayedScore: 70,
                    currentScore: 70
                  }
                }
              ]
            },
            {
              ID: 19,
              title: "Simplify or optimize manipulation",
              icon: "stagnant",
              type: "leaf",
              ring: false,
              state: "opened",
              progress: {
                displayedScore: 30,
                currentScore: 30
              }
            },
            {
              ID: 21,
              title: "Spot symetry an convert to normal form",
              type: "folder",
              ring: false,
              state: "opened",
              progress: {
                displayedScore: 70,
                currentScore: 70
              },
              children: [
                {
                  ID: 22,
                  title: "Simplify or optimize manipulation",
                  type: "leaf",
                  ring: false,
                  state: "opened",
                  progress: {
                    displayedScore: 30,
                    currentScore: 30
                  }
                },
                {
                  ID: 23,
                  title: "Spot symetry an convert to normal form",
                  type: "leaf",
                  ring: false,
                  state: "opened",
                  progress: {
                    displayedScore: 70,
                    currentScore: 70
                  }
                }
              ]
            }
          ]
        },
        {
          ID: 24,
          title: "Flood Fill",
          type: "leaf",
          ring: false,
          state: "opened",
          progress: {
            displayedScore: 70,
            currentScore: 70,
            icons: "camera"
          }
        },
        {
          ID: 25,
          title:
            "Horizontal digging (BFS) et DijkstraHorizontal digging (BFS) et DijkstraHorizontal digging (BFS) et DijkstraHorizontal digging (BFS) et DijkstraHorizontal digging (BFS) et Dijkstra",
          type: "leaf",
          ring: false,
          state: "locked",
          progress: {
            displayedScore: 20,
            currentScore: 20
          }
        }
      ]
    },
    activities: {
      title: "My Activities",
      data: [
        {
          ID: 26,
          title: "Activities to test mosaic/list modes",
          type: "folder",
          ring: true,
          state: "never opened",
          progress: {
            displayedScore: 0,
            currentScore: 0
          },
          children: [
            {
              ID: 42,
              title: "Activity with session list",
              type: "leaf",
              ring: true,
              state: "opened",
              hasKey: true,
              progress: {
                displayedScore: 30,
                currentScore: 30
              },
              category: {
                icon: "fa fa-book-open",
                type: 1
              }
            },
            {
              ID: 43,
              title: "Activity with mosaic view",
              type: "leaf",
              ring: true,
              state: "opened",
              hasKey: true,
              progress: {
                displayedScore: 20,
                currentScore: 30
              },
              category: {
                icon: "fa fa-book-open",
                type: 1
              }
            },
            {
              ID: 44,
              title: "Activity with presentation view",
              type: "leaf",
              ring: true,
              state: "opened",
              hasKey: true,
              progress: {
                displayedScore: 20,
                currentScore: 30
              },
              category: {
                icon: "fa fa-book-open",
                type: 1
              }
            }
          ],
          category: {
            icon: "fa fa-book-open",
            type: 0
          }
        },
        {
          ID: 37,
          // tslint:disable-next-line: max-line-length
          title: 'Activities to test headers',
          type: "folder",
          ring: true,
          state: "opened",
          progress: {
            displayedScore: 20,
            currentScore: 20
          },
          children: [
            {
              ID: 38,
              title: "Activity with access code",
              type: "leaf",
              ring: true,
              state: "opened",
              hasKey: true,
              progress: {
                displayedScore: 30,
                currentScore: 30
              },
              category: {
                icon: "fa fa-book-open",
                type: 1
              }
            },
            {
              ID: 39,
              title: "Before you start notice",
              type: "leaf",
              ring: true,
              state: "opened",
              hasKey: true,
              progress: {
                displayedScore: 20,
                currentScore: 30
              },
              category: {
                icon: "fa fa-book-open",
                type: 1
              }
            },
            {
              ID: 40,
              title: "Activity for teams",
              type: "leaf",
              ring: true,
              state: "opened",
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
              ID: 41,
              title: "Activity with attempts",
              type: "leaf",
              ring: true,
              state: "opened",
              hasKey: true,
              progress: {
                displayedScore: 10,
                currentScore: 30
              },
              category: {
                icon: "fa fa-book-open",
                type: 1
              }
            }
          ]
        },
        {
          ID: 27,
          title: "Reduce graph size",
          type: "folder",
          ring: true,
          state: "opened",
          progress: {
            displayedScore: 90,
            currentScore: 90
          },
          children: [
            {
              ID: 28,
              title: "Simplify or optimize manipulation",
              type: "leaf",
              ring: true,
              state: "opened",
              hasKey: true,
              progress: {
                displayedScore: 30,
                currentScore: 30
              },
              weight: 1,
              category: {
                icon: "fa fa-book-open",
                type: 1
              }
            },
            {
              ID: 29,
              title: "Spot symetry an convert to normal form",
              type: "folder",
              ring: true,
              state: "opened",
              progress: {
                displayedScore: 70,
                currentScore: 70
              },
              weight: 4,
              category: {
                icon: "fa fa-video",
                type: 2
              },
              children: [
                {
                  ID: 30,
                  title: "Simplify or optimize manipulation",
                  type: "leaf",
                  ring: true,
                  state: "opened",
                  progress: {
                    displayedScore: 30,
                    currentScore: 30
                  },
                  weight: 2,
                  category: {
                    icon: "fa fa-book-open",
                    type: 0
                  }
                },
                {
                  ID: 31,
                  title: "Spot symetry an convert to normal form",
                  type: "leaf",
                  ring: true,
                  state: "opened",
                  progress: {
                    displayedScore: 70,
                    currentScore: 70
                  },
                  weight: 3,
                  category: {
                    icon: "fa fa-book-open",
                    type: 4
                  }
                }
              ]
            },
            {
              ID: 32,
              title: "Simplify or optimize manipulation",
              type: "leaf",
              ring: true,
              state: "opened",
              isLocked: true,
              progress: {
                displayedScore: 30,
                currentScore: 30
              },
              category: {
                icon: "fa fa-laptop-code",
                type: 3
              }
            },
            {
              ID: 33,
              title: "Spot symetry an convert to normal form",
              type: "folder",
              ring: true,
              state: "opened",
              progress: {
                displayedScore: 70,
                currentScore: 70
              },
              category: {
                icon: "fa fa-code",
                type: 4
              },
              children: [
                {
                  ID: 34,
                  title: "Simplify or optimize manipulation",
                  type: "leaf",
                  ring: true,
                  state: "opened",
                  progress: {
                    displayedScore: 30,
                    currentScore: 30
                  },
                  category: {
                    icon: "fa fa-book-open",
                    type: 3
                  }
                },
                {
                  ID: 35,
                  title: "Spot symetry an convert to normal form",
                  type: "leaf",
                  ring: true,
                  state: "opened",
                  progress: {
                    displayedScore: 70,
                    currentScore: 70
                  },
                  category: {
                    icon: "fa fa-book-open",
                    type: 3
                  }
                }
              ]
            }
          ]
        },
        {
          ID: 36,
          // tslint:disable-next-line: max-line-length
          title:
            "Horizontal digging (BFS) et DijkstraHorizontal digging (BFS) et DijkstraHorizontal digging (BFS) et DijkstraHorizontal digging (BFS) et DijkstraHorizontal digging (BFS) et Dijkstra",
          type: "leaf",
          ring: true,
          state: "locked",
          progress: {
            displayedScore: 20,
            currentScore: 20
          }
        }
      ]
    }
  };

  user = {
    name: "Concours castor",
    notification: 2,
    image: "_messi.jpg"
  };

  collapsed = false;
  folded = false;
  scrolled = false;
  signedIn = true;
  notified = false;
  activityORSkill = true;

  taskdata;
  selectedType = -1;
  userTitle;

  constructor(
    private nodeService: NodeService,
    private editService: EditService,
    private router: Router
  ) {}

  // tslint:disable-next-line: use-lifecycle-interface
  ngOnInit() {
    this.nodeService.getFiles().then(res => {
      this.files = res;
      this.groups = _.cloneDeep(res);
    });
    this.editService.setUser({
      title: "Lionel MESSI",
      avatar: "_messi.jpg",
      type: "user"
    });
    this.editService.getOb().subscribe(res => {
      this.scrolled = res.scrolled;
      this.folded = res.folded;
      this.isStarted = res.isStarted;
      this.collapsed = res.collapsed;
      this.activityORSkill = res.activityORSkill;
      this.editing = res.editing;
      this.notified = res.notified;
      this.userTitle = res.userTitle;
    });
  }

  updateService() {
    this.editService.setValue({
      scrolled: this.scrolled,
      folded: this.folded,
      isStarted: this.isStarted,
      collapsed: this.collapsed,
      activityORSkill: this.activityORSkill,
      editing: this.editing,
      notified: this.notified,
      userTitle: this.userTitle
    });
  }

  onCollapse(e) {
    this.collapsed = e;
    if (!this.collapsed) {
      this.folded = false;
    }
    this.updateService();
  }

  onFold(e) {
    this.folded = e;
    console.log(e);
  }

  onSignInOut(e) {
    this.signedIn = e;
    if (!this.signedIn) {
      this.router.navigate(["/design/home"]);
    } else {
      this.selectedType = 0;
      this.userTitle = "Cyril KITSCH";
      this.updateService();
      this.router.navigate(["/design/yourself"], {
        state: {}
      });
    }
  }

  onDisplayScoreChange(e) {
    this.dispScore = e.srcElement.valueAsNumber;
  }

  onCurrentScoreChange(e) {
    this.curScore = e.srcElement.valueAsNumber;
  }

  onIsStartedChange(e) {
    this.isStarted = e.srcElement.checked;
  }

  @HostListener("window:scroll", ["$event"])
  onScrollContent(e) {
    if (window.pageYOffset > 40 && !this.scrolled) {
      this.scrolled = true;
    } else if (window.pageYOffset <= 40 && this.scrolled) {
      this.scrolled = false;
    }
  }

  onSkillSelected(e) {
    this.selectedType = 2;
    this.userTitle = e.title;
    this.activityORSkill = false;
    this.taskdata = e;
    this.updateService();
    this.router.navigate([`/design/task/${e.ID}`], {
      queryParams: {
        refresh: new Date().getTime()
      },
      state: {
        taskdata: this.taskdata
      }
    });
  }

  onActivitySelected(e) {
    this.selectedType = 2;
    this.userTitle = e.title;
    this.activityORSkill = true;
    this.taskdata = e;
    this.updateService();
    this.router.navigate([`/design/task/${e.ID}`], {
      queryParams: {
        refresh: new Date().getTime()
      },
      state: {
        taskdata: this.taskdata
      }
    });
  }

  onYourselfSelected(e) {
    this.selectedType = 0;
    this.userTitle = "Cyril KITSCH";
    this.updateService();
    this.router.navigate(["/design/yourself"], {
      state: {}
    });
  }

  onJoinGroupSelected(e) {
    this.selectedType = 3;
    this.userTitle = 'Groups you joined';
    this.updateService();
    this.router.navigate(['/design/group-info'], {
      queryParams: {
        refresh: new Date().getTime()
      },
      state: {
        title: 'Groups you joined',
        subtitle: 'Here are the groups you joined, you can leave them ore add new ones, lorem ipsum dolor sit amet',
        showJoined: true
      }
    });
  }

  onManageGroupSelected(e) {
    this.selectedType = 3;
    this.userTitle = 'Groups you manage';
    this.updateService();
    this.router.navigate(['/design/group-info'], {
      queryParams: {
        refresh: new Date().getTime()
      },
      state: {
        title: 'Groups you manage',
        subtitle: 'Here are the groups you manage, you can leave them ore add new ones, lorem ipsum dolor sit amet',
        showJoined: false
      }
    });
  }

  onGroupSelected(e) {
    this.selectedType = 1;
    this.userTitle = "Jean Monet";
    this.updateService();
    this.router.navigate(["/design/group"], {
      queryParams: {
        refresh: new Date().getTime()
      },
      state: {
        groupdata: e
      }
    });
  }

  onEditPage(e) {
    this.editing = true;
    this.updateService();
  }

  onEditCancel(e) {
    this.editing = false;
    this.updateService();
  }

  onNotify(e) {
    this.selectedType = 5;
    this.userTitle = 'Notifications';
    this.notified = true;
    this.updateService();
    this.router.navigate(["/design/notification"]);
  }
}
