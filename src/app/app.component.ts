import { Component, HostListener } from '@angular/core';
import { PickListType, PickListColor } from './pick-list/pick-list.component';
import { ProgressType } from './basic-component/skill-progress/skill-progress.component';
import { NodeService } from './services/node-service.service';
import * as _ from 'lodash';

import { ButtonComponent } from './basic-component/button/button.component';

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
      { ID: 1, label: 'Contest' },
      { ID: 42, label: 'Personalized contest', attempt: 12 },
      { ID: 21, label: 'IOI Selection 2012', attempt: 2 }
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

  personal = [
    {
      field: 'Login',
      value: 'CyrilK67'
    },
    {
      field: 'First name',
      value: 'Cyril'
    },
    {
      field: 'Last name',
      value: 'Kitsch'
    },
    {
      field: 'Display my real name on my public profile',
      value: 'non'
    },
    {
      field: 'Birth date',
      value: '24/12/1985'
    },
    {
      field: 'Student ID',
      value: '568DH8H9'
    },
    {
      field: 'Sex',
      value: 'Mascuin'
    },
    {
      field: 'Nationality',
      value: 'France'
    },
    {
      field: 'Personal Web page',
      value: 'www.cyrilk.com'
    }
  ];
  school = [
    {
      field: 'Your grade',
      value: 'Terminale'
    },
    {
      field: 'Highschool graduation year',
      value: '2019'
    },
    {
      field: 'Residence country',
      value: 'France'
    },
    {
      field: 'Role',
      value: 'Etudiant'
    }
  ];
  contact = [
    {
      field: 'Primary email',
      value: 'cyrilk@mail.com'
    },
    {
      field: 'Secondary email',
      value: 'cyril.kitsch@academy.org'
    },
    {
      field: 'Address',
      value: '34, rue des tulipes'
    },
    {
      field: 'City',
      value: 'PARIS'
    },
    {
      field: 'Zipcode',
      value: '75020'
    },
    {
      field: 'Primary phone number',
      value: '06 45 37 69 80'
    },
    {
      field: 'Secondary phone number',
      value: '07 65 74 83 93'
    }
  ];
  parameters = [
    {
      field: 'Language',
      value: 'French'
    },
    {
      field: 'Time zone',
      value: 'Paris (GMT+1)'
    }
  ];

  tabs = {
    overview: {
      label: 'Overview',
      icon: 'fa fa-chart-pie'
    },
    personal: {
      label: 'Personal Data',
      icon: 'fa fa-user',
      data: [
        {
          title: 'Personal Information',
          icon: 'fa fa-users',
          items: this.personal
        },
        {
          title: 'School Information',
          icon: 'fa fa-graduation-cap',
          items: this.school
        },
        {
          title: 'Contact Information',
          icon: 'fa fa-envelope',
          items: this.contact
        },
        {
          title: 'Parameters',
          icon: 'fa fa-cog',
          items: this.parameters
        }
      ]
    },
    settings: {
      label: 'Settings',
      icon: 'fa fa-cog'
    }
  };


  collapsed = false;
  folded = false;
  scrolled = false;

  activityORSkill = false;

  taskdata;

  constructor(private nodeService: NodeService) {}

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
    this.activityORSkill = false;
    this.taskdata = e;
  }

  onActivitySelected(e) {
    this.activityORSkill = true;
    this.taskdata = e;
    console.log(this.activityORSkill, e);
  }
}
