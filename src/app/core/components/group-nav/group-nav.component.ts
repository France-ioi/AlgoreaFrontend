/* eslint-disable */ /* FIXME disabled for now while this is the mockup code, to be removed afterwards */
import { Component, OnInit, Output, ViewChild, EventEmitter } from '@angular/core';
import { StatusService } from 'src/app/shared/services/status.service';

@Component({
  selector: 'alg-group-nav',
  templateUrl: './group-nav.component.html',
  styleUrls: ['./group-nav.component.scss']
})
export class GroupNavComponent implements OnInit {

  @Output() focusOnGroupNav = new EventEmitter<void>();

  @Output() yourselfSelect = new EventEmitter<any>();
  @Output() groupSelect = new EventEmitter<any>();
  @Output() joinGroupSelect = new EventEmitter<any>();
  @Output() manageGroupSelect = new EventEmitter<any>();

  items = {
    selectedID: 1, // User selected ID
    groups: {
      manage: [
        {
          ID: 50,
          title: 'Group 50',
          type: 'leaf',
          icons: 'fa fa-home'
        },
        {
          ID: 51,
          title: 'Group 51',
          type: 'leaf',
          icons: 'fa fa-home'
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
            },
            {
              ID: 45,
              title: 'Reminder of rights given to manager',
              type: 'leaf',
              ring: true,
              state: 'opened',
              hasKey: true,
              progress: {
                displayedScore: 50,
                currentScore: 30
              },
              category: {
                icon: 'fa fa-book-open',
                type: 1
              }
            }
          ]
        }
      ]
    },
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
        type: 'user'
      },
      {
        ID: 3,
        title: 'FC Barcelona',
        type: 'group'
      }
    ],
  };
  manageShow = false;
  joinShow = false;
  selectedGroup = -1;
  currentUser;

  constructor(
    private statusService: StatusService,
  ) { }

  ngOnInit(): void {
  }

  fetchUser() {
    for (const user of this.items.users) {
      if (user.ID === this.items.selectedID) {
        this.currentUser = user;
        break;
      }
    }
  }

  onTabOpen(e) {
    this.selectedGroup = e.index + 1;
    if (e.index === 0) {
      this.manageShow = true;
      this.manageGroupSelect.emit(e);
    } else {
      this.joinShow = true;
      this.joinGroupSelect.emit(e);
    }
    this.focusOnGroupNav.emit();
  }

  onTabClose(e) {
    this.selectedGroup = e.index + 1;
    if (e.index === 0) {
      this.manageShow = false;
      this.manageGroupSelect.emit(e);
    } else {
      this.joinShow = false;
      this.joinGroupSelect.emit(e);
    }
    this.focusOnGroupNav.emit();
  }


  onSelectYourself(e, idx) {
    this.selectedGroup = idx;
    this.fetchUser();
    this.statusService.setUser(this.currentUser);
    this.yourselfSelect.emit(e);
  }

  onNodeChange(e, src) {
    this.currentUser = {
      title: e.title,
      type: 'group'
    };

    this.selectedGroup = 3;

    this.statusService.setUser(this.currentUser);
    this.groupSelect.emit({
      e,
      src
    });
  }

  onTitleChange(e) {
    this.currentUser = {
      title: e.title,
      type: 'group'
    };

    this.selectedGroup = 3;

    this.statusService.setUser(this.currentUser);
  }

  onKeyDown(e) {
    e.preventDefault();

    if (
      e.code !== 'ArrowDown' &&
      e.code !== 'ArrowUp' &&
      e.code !== 'ArrowLeft' &&
      e.code !== 'ArrowRight' &&
      e.code !== 'Space' &&
      e.code !== 'Enter') {
      return;
    }

    // e.stopPropagation();
    if (e.code === 'ArrowUp') {
      this.selectedGroup = (this.selectedGroup - 1 + 3) % 3;
    } else if (e.code === 'ArrowDown') {
      this.selectedGroup = (this.selectedGroup + 1) % 3;
    } else if (e.code === 'Space' || e.code === 'Enter') {
      switch (this.selectedGroup) {
        case 0:
          this.fetchUser();
          this.statusService.setUser(this.currentUser);
          this.yourselfSelect.emit(e);
          break;
        case 1:
          this.manageShow = !this.manageShow;
          this.manageGroupSelect.emit({
            index: 0
          });
          break;
        default:
          this.joinShow = !this.joinShow;
          this.joinGroupSelect.emit({
            index: 1
          });
      }
    } else {
      if (this.selectedGroup === 1) {
        this.manageShow = e.code === 'ArrowRight';
      } else if (this.selectedGroup === 2) {
        this.joinShow = e.code === 'ArrowRight';
      }
    }
  }

}
