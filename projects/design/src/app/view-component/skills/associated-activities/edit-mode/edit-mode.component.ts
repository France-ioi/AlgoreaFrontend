import { Component, OnInit, Input } from '@angular/core';
import { Router } from '@angular/router';
import { EditService } from 'projects/design/src/app/services/edit.service';

@Component({
  selector: 'app-associated-activities-edit',
  templateUrl: './edit-mode.component.html',
  styleUrls: ['./edit-mode.component.scss']
})
export class AssociatedActivitiesEditModeComponent implements OnInit {

  gridFilters = [
    {
      ID: 1,
      icon: 'fa fa-flag-checkered',
      label: 'Only associated items',
      type: 'default',
      mode: 'list',
      list: [
        { label: 'Item 1', value: { id: 1, value: 'item1' } },
        { label: 'Item 2', value: { id: 2, value: 'item2' } },
        { label: 'Item 3', value: { id: 3, value: 'item3' } },
        { label: 'Item 4', value: { id: 4, value: 'item4' } },
        { label: 'Item 5', value: { id: 5, value: 'item5' } },
        { label: 'Item 6', value: { id: 6, value: 'item6' } },
        { label: 'Item 7', value: { id: 7, value: 'item7' } },
        { label: 'Item 8', value: { id: 8, value: 'item8' } },
        { label: 'Item 9', value: { id: 9, value: 'item9' } }
      ]
    }
  ];

  ranges = [0, 20];

  filterChoice = [
    'Add a filter',
    'Range of date',
    'Location',
    'Score range'
  ];

  trees = [
    {
      ID: 27,
      title: 'Reduce graph size',
      type: 'folder',
      icons: 'fa fa-folder',
      ring: true,
      state: 'opened',
      connected: true,
      progress: {
        displayedScore: 90,
        currentScore: 90
      },
      children: [
        {
          ID: 37,
          title: 'Activities to test headers',
          type: 'folder',
          ring: true,
          icons: 'fa fa-folder',
          state: 'opened',
          connected: true,
          progress: {
            displayedScore: 20,
            currentScore: 20
          },
          children: [
            {
              ID: 38,
              title: 'Activity with access code',
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
                type: 1
              }
            },
            {
              ID: 39,
              title: 'Before you start notice',
              type: 'leaf',
              ring: true,
              state: 'opened',
              hasKey: true,
              progress: {
                displayedScore: 20,
                currentScore: 30
              },
              category: {
                icon: 'fa fa-book-open',
                type: 1
              }
            },
            {
              ID: 40,
              title: 'Activity for teams',
              type: 'leaf',
              ring: true,
              state: 'opened',
              hasKey: true,
              progress: {
                displayedScore: 90,
                currentScore: 30
              },
              category: {
                icon: 'fa fa-book-open',
                type: 1
              }
            },
            {
              ID: 41,
              title: 'Activity with attempts',
              type: 'leaf',
              ring: true,
              state: 'opened',
              hasKey: true,
              progress: {
                displayedScore: 10,
                currentScore: 30
              },
              category: {
                icon: 'fa fa-book-open',
                type: 1
              }
            }
          ]
        },
        {
          ID: 28,
          title: 'Simplify or optimize manipulation',
          type: 'leaf',
          ring: true,
          connected: true,
          state: 'opened',
          hasKey: true,
          progress: {
            displayedScore: 30,
            currentScore: 30
          },
          weight: 1,
          category: {
            icon: 'fa fa-book-open',
            type: 1
          }
        },
        {
          ID: 29,
          title: 'Spot symetry an convert to normal form',
          type: 'folder',
          ring: true,
          connected: true,
          state: 'opened',
          progress: {
            displayedScore: 70,
            currentScore: 70
          },
          weight: 4,
          category: {
            icon: 'fa fa-video',
            type: 2
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
              weight: 2,
              category: {
                icon: 'fa fa-book-open',
                type: 0
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
              weight: 3,
              category: {
                icon: 'fa fa-book-open',
                type: 4
              }
            }
          ]
        },
        {
          ID: 32,
          title: 'Simplify or optimize manipulation',
          type: 'leaf',
          ring: true,
          state: 'opened',
          isLocked: true,
          progress: {
            displayedScore: 30,
            currentScore: 30
          },
          category: {
            icon: 'fa fa-laptop-code',
            type: 3
          }
        },
        {
          ID: 33,
          title: 'Spot symetry an convert to normal form',
          type: 'folder',
          ring: true,
          state: 'opened',
          progress: {
            displayedScore: 70,
            currentScore: 70
          },
          category: {
            icon: 'fa fa-code',
            type: 4
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
                type: 3
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
                type: 3
              }
            }
          ]
        }
      ]
    }
  ];

  status;

  constructor(
    private router: Router,
    private editService: EditService
  ) { }

  ngOnInit() {
    this.editService.getOb().subscribe(res => {
      this.status = res;
    });
  }

  onGotoPage(node) {
    this.status.selectedType = 2;
    this.status.activityORSkill = true;
    this.editService.setValue(this.status);
    this.editService.setUser({
      title: node.title,
      type: 'activity'
    });
    this.router.navigate([`/design/task/${node.ID}`], {
      queryParams: {
        refresh: new Date().getTime()
      },
      state: {
        taskdata: node
      }
    });
  }

  removeFilter(id) {
    this.gridFilters = this.gridFilters.filter(el => {
      return el.ID !== id;
    });
  }

}
