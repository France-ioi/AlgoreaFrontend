import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-associated-activities',
  templateUrl: './associated-activities.component.html',
  styleUrls: ['./associated-activities.component.scss']
})
export class AssociatedActivitiesComponent implements OnInit {

  suggested = [
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
      },
      sessions: [
        {
          date: new Date(),
          location: 'Paris',
          online: false
        },
        {
          date: new Date(),
          location: 'Paris',
          online: true
        },
        {
          date: new Date(),
          location: 'Lion',
          online: false
        }
      ]
    },
    {
      ID: 41,
      title: "Activity with attempts",
      type: "leaf",
      ring: true,
      state: "opened",
      progress: {
        displayedScore: 10,
        currentScore: 30
      },
      category: {
        icon: "fa fa-book-open",
        type: 1
      }
    }
  ];

  associated = [
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
      },
      sessions: [
        {
          date: new Date(),
          location: 'Paris',
          online: false
        },
        {
          date: new Date(),
          location: 'Paris',
          online: true
        },
        {
          date: new Date(),
          location: 'Lion',
          online: false
        }
      ]
    },
    {
      ID: 41,
      title: "Activity with attempts",
      type: "leaf",
      ring: true,
      state: "opened",
      progress: {
        displayedScore: 10,
        currentScore: 30
      },
      category: {
        icon: "fa fa-book-open",
        type: 1
      }
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

  gridSelect = false;

  ranges = [0, 20];

  filterChoice = [
    "Select a filter",
    "Range of date",
    "Location",
    "Score range"
  ];

  sels = [
    {
      label: 'All'
    },
    {
      label: 'Online'
    },
    {
      label: 'On site only'
    }
  ];

  select

  constructor() { }

  ngOnInit() {
  }

  removeFilter(id) {
    this.gridFilters = this.gridFilters.filter(el => {
      return el.ID !== id;
    });
  }

}
