import { Component, HostListener } from '@angular/core';
import { PickListType, PickListColor } from './pick-list/pick-list.component';
import { ProgressType } from './basic-component/skill-progress/skill-progress.component';
import { NodeService } from './services/node-service.service';
import * as _ from 'lodash';

import { ButtonComponent } from './basic-component/button/button.component';
import { Router } from '@angular/router';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  ProgressType = ProgressType;
  title = 'france-ioi';
  list = {
    lists: [
      {
        ID: PickListType.Standard,
        title: 'Select columns to import',
        color: PickListColor.Standard
      },
      {
        ID: PickListType.Imported,
        title: 'Imported columns',
        color: PickListColor.Imported
      }
    ],
    items: [
      { ID: 1, title: 'Last name', list: PickListType.Standard },
      { ID: 2, title: 'Grade', list: PickListType.Standard },
      { ID: 3, title: 'Sub-group', list: PickListType.Standard },
      { ID: 4, title: 'First name', list: PickListType.Imported }
    ]
  };
  list1 = {
    lists: [
      {
        ID: PickListType.NonRequested,
        title: 'Non-requested fields',
        color: PickListColor.NonRequested
      },
      {
        ID: PickListType.Standard,
        title: 'Recommended fields',
        color: PickListColor.Standard
      },
      {
        ID: PickListType.Mandatory,
        title: 'Mandatory fields',
        color: PickListColor.Mandatory
      }
    ],
    items: [
      { ID: 1, title: 'Online', list: PickListType.NonRequested },
      { ID: 2, title: 'Change Password', list: PickListType.NonRequested },
      { ID: 3, title: 'E-mail', list: PickListType.Standard },
      { ID: 4, title: 'Member\'s activity', list: PickListType.Standard },
      { ID: 5, title: 'Skills', list: PickListType.Standard },
      { ID: 6, title: 'Participation code', list: PickListType.Standard },
      { ID: 7, title: 'First name', list: PickListType.Mandatory },
      { ID: 8, title: 'Last name', list: PickListType.Mandatory },
      { ID: 9, title: 'Login', list: PickListType.Mandatory }
    ]
  };
  curScore = 70;
  dispScore = 65;
  isStarted = true;

  // Tree Data

  files;
  groups;
  trees;

  allowFullScreen = false;

  breaddata = {
    selectedID: 42,
    path: [
      { ID: 1, label: 'Contest', separator: 'slash' },
      { ID: 42, label: 'Personalized contest', attempt: 12, separator: 'arrow' },
      { ID: 21, label: 'IOI Selection 2012', attempt: 2 },
      { ID: 22, label: 'Individual', separator: 'slash' },
      { ID: 43, label: 'Personalized contests', attempt: 12 },
      { ID: 23, label: 'IOI Selection 2012', attempt: 2 },
      { ID: 24, label: 'Individuals', separator: 'slash' }
    ]
  };

  groupdata = {
    selectedID: 1,  // User selected ID
    currentID: 1,   // Current User ID
    users: [
      {
        ID: 1,
        title: 'Lionel MESSI',
        avatar: '_messi.jpg',
        type: 'user'
      },
      {
        ID: 2,
        title: 'Suarez',
        type: 'user',
      },
      {
        ID: 3,
        title: 'FC Barcelona',
        type: 'group'
      }
    ],
    groups: {
      manage: [
        {
          title: 'Big root',
          type: 'folder',
          icons: 'fa fa-home',
          children: [
            {
              title: 'Big root1',
              type: 'folder',
              progress: {
                currentScore: 50,
                displayedScore: 30
              },
              children: [
                {
                  title: 'Documents',
                  icons: 'fa fa-folder',
                  type: 'folder',
                  children: [
                    {
                      title: 'Work',
                      type: 'folder',
                      children: [
                        {
                          title: 'Expenses.doc',
                          type: 'leaf'
                        },
                        {
                          title: 'Resume.doc',
                          type: 'leaf'
                        }
                      ]
                    },
                    {
                      title: 'Resume.doc',
                      type: 'leaf'
                    },
                    {
                      title: 'Home',
                      type: 'folder',
                      children: [
                        {
                          title: 'Invoices.txt',
                          type: 'leaf'
                        },
                        {
                          title: 'Work',
                          type: 'folder',
                          children: [
                            {
                              title: 'Expenses.doc',
                              type: 'leaf'
                            },
                            {
                              title: 'Resume.doc',
                              type: 'leaf'
                            }
                          ]
                        }
                      ]
                    }
                  ]
                },
                {
                  title: 'Pictures',
                  type: 'folder',
                  children: [
                    {
                      title: 'barcelona.jpg',
                      type: 'leaf'
                    },
                    {
                      title: 'logo.jpg',
                      type: 'leaf'
                    },
                    {
                      title: 'primeui.png',
                      type: 'leaf'
                    }
                  ]
                },
                {
                  title: 'Movies',
                  type: 'folder',
                  children: [
                    {
                      title: 'Al Pacino',
                      type: 'folder',
                      children: [
                        {
                          title: 'Scarface',
                          type: 'leaf'
                        },
                        {
                          title: 'Serpico',
                          type: 'leaf'
                        }
                      ]
                    },
                    {
                      title: 'Robert De Niro',
                      type: 'folder',
                      children: [
                        {
                          title: 'Goodfellas',
                          type: 'leaf'
                        },
                        {
                          title: 'Untouchables',
                          type: 'leaf'
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
          title: 'Big root',
          type: 'folder',
          icons: 'fa fa-home',
          children: [
            {
              title: 'Big root1',
              type: 'folder',
              progress: {
                currentScore: 50,
                displayedScore: 30
              },
              children: [
                {
                  title: 'Documents',
                  icons: 'fa fa-folder',
                  type: 'folder',
                  children: [
                    {
                      title: 'Work',
                      type: 'folder',
                      children: [
                        {
                          title: 'Expenses.doc',
                          type: 'leaf'
                        },
                        {
                          title: 'Resume.doc',
                          type: 'leaf'
                        }
                      ]
                    },
                    {
                      title: 'Resume.doc',
                      type: 'leaf'
                    },
                    {
                      title: 'Home',
                      type: 'folder',
                      children: [
                        {
                          title: 'Invoices.txt',
                          type: 'leaf'
                        },
                        {
                          title: 'Work',
                          type: 'folder',
                          children: [
                            {
                              title: 'Expenses.doc',
                              type: 'leaf'
                            },
                            {
                              title: 'Resume.doc',
                              type: 'leaf'
                            }
                          ]
                        }
                      ]
                    }
                  ]
                },
                {
                  title: 'Pictures',
                  type: 'folder',
                  children: [
                    {
                      title: 'barcelona.jpg',
                      type: 'leaf'
                    },
                    {
                      title: 'logo.jpg',
                      type: 'leaf'
                    },
                    {
                      title: 'primeui.png',
                      type: 'leaf'
                    }
                  ]
                },
                {
                  title: 'Movies',
                  type: 'folder',
                  children: [
                    {
                      title: 'Al Pacino',
                      type: 'folder',
                      children: [
                        {
                          title: 'Scarface',
                          type: 'leaf'
                        },
                        {
                          title: 'Serpico',
                          type: 'leaf'
                        }
                      ]
                    },
                    {
                      title: 'Robert De Niro',
                      type: 'folder',
                      children: [
                        {
                          title: 'Goodfellas',
                          type: 'leaf'
                        },
                        {
                          title: 'Untouchables',
                          type: 'leaf'
                        }
                      ]
                    }
                  ]
                }
              ]
            }
          ]
        }
      ],
      join: [
        {
          title: 'Big root',
          type: 'folder',
          icons: 'fa fa-home',
          children: [
            {
              title: 'Big root1',
              type: 'folder',
              progress: {
                currentScore: 50,
                displayedScore: 30
              },
              children: [
                {
                  title: 'Documents',
                  icons: 'fa fa-folder',
                  type: 'folder',
                  children: [
                    {
                      title: 'Work',
                      type: 'folder',
                      children: [
                        {
                          title: 'Expenses.doc',
                          type: 'leaf'
                        },
                        {
                          title: 'Resume.doc',
                          type: 'leaf'
                        }
                      ]
                    },
                    {
                      title: 'Resume.doc',
                      type: 'leaf'
                    },
                    {
                      title: 'Home',
                      type: 'folder',
                      children: [
                        {
                          title: 'Invoices.txt',
                          type: 'leaf'
                        },
                        {
                          title: 'Work',
                          type: 'folder',
                          children: [
                            {
                              title: 'Expenses.doc',
                              type: 'leaf'
                            },
                            {
                              title: 'Resume.doc',
                              type: 'leaf'
                            }
                          ]
                        }
                      ]
                    }
                  ]
                },
                {
                  title: 'Pictures',
                  type: 'folder',
                  children: [
                    {
                      title: 'barcelona.jpg',
                      type: 'leaf'
                    },
                    {
                      title: 'logo.jpg',
                      type: 'leaf'
                    },
                    {
                      title: 'primeui.png',
                      type: 'leaf'
                    }
                  ]
                },
                {
                  title: 'Movies',
                  type: 'folder',
                  children: [
                    {
                      title: 'Al Pacino',
                      type: 'folder',
                      children: [
                        {
                          title: 'Scarface',
                          type: 'leaf'
                        },
                        {
                          title: 'Serpico',
                          type: 'leaf'
                        }
                      ]
                    },
                    {
                      title: 'Robert De Niro',
                      type: 'folder',
                      children: [
                        {
                          title: 'Goodfellas',
                          type: 'leaf'
                        },
                        {
                          title: 'Untouchables',
                          type: 'leaf'
                        }
                      ]
                    }
                  ]
                }
              ]
            }
          ]
        }
      ]
    },
    skills: {
      title: 'Algorithmic skills',
      data: [
        {
          ID: 12,
          title: 'Graphs: methods',
          type: 'leaf',
          ring: true,
          state: 'started',
          progress: {
            displayedScore: 100,
            currentScore: 100
          }
        },
        {
          ID: 13,
          title: 'List graph caracteristics',
          type: 'leaf',
          ring: false,
          state: 'never opened',
          progress: {
            displayedScore: 0,
            currentScore: 0
          }
        },
        {
          ID: 14,
          title: 'Reduce graph size',
          type: 'folder',
          ring: false,
          state: 'opened',
          progress: {
            displayedScore: 90,
            currentScore: 90
          },
          children: [
            {
              ID: 15,
              title: 'Simplify or optimize manipulation',
              icon: 'progress',
              type: 'leaf',
              ring: true,
              state: 'opened',
              progress: {
                displayedScore: 30,
                currentScore: 30
              }
            },
            {
              ID: 16,
              title: 'Spot symetry an convert to normal form',
              icon: 'regress',
              type: 'folder',
              ring: true,
              state: 'opened',
              progress: {
                displayedScore: 70,
                currentScore: 70
              },
              children: [
                {
                  ID: 17,
                  title: 'Simplify or optimize manipulation',
                  icon: 'stagnant',
                  type: 'leaf',
                  ring: true,
                  state: 'opened',
                  progress: {
                    displayedScore: 30,
                    currentScore: 30
                  }
                },
                {
                  ID: 18,
                  title: 'Spot symetry an convert to normal form',
                  type: 'leaf',
                  ring: true,
                  state: 'opened',
                  progress: {
                    displayedScore: 70,
                    currentScore: 70
                  }
                }
              ]
            },
            {
              ID: 19,
              title: 'Simplify or optimize manipulation',
              icon: 'stagnant',
              type: 'leaf',
              ring: false,
              state: 'opened',
              progress: {
                displayedScore: 30,
                currentScore: 30
              }
            },
            {
              ID: 21,
              title: 'Spot symetry an convert to normal form',
              type: 'folder',
              ring: false,
              state: 'opened',
              progress: {
                displayedScore: 70,
                currentScore: 70
              },
              children: [
                {
                  ID: 22,
                  title: 'Simplify or optimize manipulation',
                  type: 'leaf',
                  ring: true,
                  state: 'opened',
                  progress: {
                    displayedScore: 30,
                    currentScore: 30
                  }
                },
                {
                  ID: 23,
                  title: 'Spot symetry an convert to normal form',
                  type: 'leaf',
                  ring: true,
                  state: 'opened',
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
          title: 'Flood Fill',
          type: 'leaf',
          ring: true,
          state: 'opened',
          progress: {
            displayedScore: 70,
            currentScore: 70,
            icons: 'camera'
          }
        },
        {
          ID: 25,
          title: 'Horizontal digging (BFS) et DijkstraHorizontal digging (BFS) et DijkstraHorizontal digging (BFS) et DijkstraHorizontal digging (BFS) et DijkstraHorizontal digging (BFS) et Dijkstra',
          type: 'leaf',
          ring: false,
          state: 'locked',
          progress: {
            displayedScore: 20,
            currentScore: 20
          }
        }
      ]
  },
    activities: {
      title: 'My Activities',
      data: [
        {
          ID: 26,
          title: 'List graph caracteristics',
          type: 'leaf',
          ring: false,
          state: 'never opened',
          progress: {
            displayedScore: 0,
            currentScore: 0
          },
          category: {
            icon: 'fa fa-book-open',
            label: 'Discovery'
          }
        },
        {
          ID: 27,
          title: 'Reduce graph size',
          type: 'folder',
          ring: false,
          state: 'opened',
          progress: {
            displayedScore: 90,
            currentScore: 90
          },
          children: [
            {
              ID: 28,
              title: 'Simplify or optimize manipulation',
              type: 'leaf',
              ring: true,
              state: 'opened',
              hasKey: true,
              progress: {
                displayedScore: 30,
                currentScore: 30
              },
              category: {
                icon: 'fa fa-book-open',
                label: 'Discovery'
              }
            },
            {
              ID: 29,
              title: 'Spot symetry an convert to normal form',
              type: 'folder',
              ring: true,
              state: 'opened',
              progress: {
                displayedScore: 70,
                currentScore: 70
              },
              category: {
                icon: 'fa fa-video',
                label: 'Validation'
              },
              children: [
                {
                  ID: 30,
                  title: 'Simplify or optimize manipulation',
                  type: 'leaf',
                  ring: true,
                  state: 'opened',
                  progress: {
                    displayedScore: 30,
                    currentScore: 30
                  },
                  category: {
                    icon: 'fa fa-book-open',
                    label: 'Discovery'
                  }
                },
                {
                  ID: 31,
                  title: 'Spot symetry an convert to normal form',
                  type: 'leaf',
                  ring: true,
                  state: 'opened',
                  progress: {
                    displayedScore: 70,
                    currentScore: 70
                  },
                  category: {
                    icon: 'fa fa-book-open',
                    label: 'Discovery'
                  }
                }
              ]
            },
            {
              ID: 32,
              title: 'Simplify or optimize manipulation',
              type: 'leaf',
              ring: false,
              state: 'opened',
              isLocked: true,
              progress: {
                displayedScore: 30,
                currentScore: 30
              },
              category: {
                icon: 'fa fa-laptop-code',
                label: 'Training'
              }
            },
            {
              ID: 33,
              title: 'Spot symetry an convert to normal form',
              type: 'folder',
              ring: false,
              state: 'opened',
              progress: {
                displayedScore: 70,
                currentScore: 70
              },
              category: {
                icon: 'fa fa-code',
                label: 'Course'
              },
              children: [
                {
                  ID: 34,
                  title: 'Simplify or optimize manipulation',
                  type: 'leaf',
                  ring: true,
                  state: 'opened',
                  progress: {
                    displayedScore: 30,
                    currentScore: 30
                  },
                  category: {
                    icon: 'fa fa-book-open',
                    label: 'Discovery'
                  }
                },
                {
                  ID: 35,
                  title: 'Spot symetry an convert to normal form',
                  type: 'leaf',
                  ring: true,
                  state: 'opened',
                  progress: {
                    displayedScore: 70,
                    currentScore: 70
                  },
                  category: {
                    icon: 'fa fa-book-open',
                    label: 'Discovery'
                  }
                }
              ]
            }
          ]
        },
        {
          ID: 36,
          // tslint:disable-next-line: max-line-length
          title: 'Horizontal digging (BFS) et DijkstraHorizontal digging (BFS) et DijkstraHorizontal digging (BFS) et DijkstraHorizontal digging (BFS) et DijkstraHorizontal digging (BFS) et Dijkstra',
          type: 'leaf',
          ring: false,
          state: 'locked',
          progress: {
            displayedScore: 20,
            currentScore: 20
          }
        }
    ]}
  };

  user = {
    name: 'Concours castor',
    notification: 2,
    image: '_messi.jpg'
  };


  collapsed = false;
  folded = false;
  scrolled = false;

  activityORSkill = false;

  taskdata;
  selectedType = -1;
  userTitle;

  constructor(
    private nodeService: NodeService,
    private router: Router
  ) { }

  // tslint:disable-next-line: use-lifecycle-interface
  ngOnInit() {
    this.nodeService.getFiles().then(res => {
      this.files = res;
      this.groups = _.cloneDeep(res);
    });
    this.nodeService.getTrees().then(res => {
      this.trees = res;
    });
  }

  onCollapse(e) {
    this.collapsed = e;
  }

  onFold(e) {
    this.folded = e;
    console.log(e);
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

  @HostListener('window:scroll', ['$event'])
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
    this.router.navigate([`/task/${e.ID}`], {
      queryParams: {
        refresh: new Date().getTime()
      },
      state: {
        scrolled: this.scrolled,
        folded: this.folded,
        isStarted: this.isStarted,
        collapsed: this.collapsed,
        taskdata: this.taskdata,
        activityORSkill: this.activityORSkill
      }
    });
  }

  onActivitySelected(e) {
    this.selectedType = 2;
    this.userTitle = e.title;
    this.activityORSkill = true;
    this.taskdata = e;
    this.router.navigate([`/task/${e.ID}`], {
      queryParams: {
        refresh: new Date().getTime()
      },
      state: {
        scrolled: this.scrolled,
        folded: this.folded,
        isStarted: this.isStarted,
        collapsed: this.collapsed,
        taskdata: this.taskdata,
        activityORSkill: this.activityORSkill
      }
    });
  }

  onYourselfSelected(e) {
    this.selectedType = 0;
    this.userTitle = 'Cyril KITSCH';
    this.router.navigate(['/yourself'], {
      state: {
        scrolled: this.scrolled,
        folded: this.folded,
        isStarted: this.isStarted,
        collapsed: this.collapsed
      }
    });
  }

  onGroupSelected(e) {
    this.selectedType = 1;
    this.userTitle = 'Jean Monet';
    this.router.navigate(['/group'], {
      queryParams: {
        refresh: new Date().getTime()
      },
      state: {
        scrolled: this.scrolled,
        folded: this.folded,
        isStarted: this.isStarted,
        collapsed: this.collapsed,
        groupdata: e
      }
    });
  }
}
