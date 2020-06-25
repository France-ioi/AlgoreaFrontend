import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-search-tab',
  templateUrl: './search-tab.component.html',
  styleUrls: ['./search-tab.component.scss'],
})
export class SearchTabComponent implements OnInit {
  sels = [
    {
      label: 'SKILLS (4)',
    },
    {
      label: 'Activity (2)',
    },
    {
      label: 'Users (0)',
    },
  ];

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
        { label: 'Item 9', value: { id: 9, value: 'item9' } },
      ],
    },
  ];

  ranges = [0, 20];
  selected = 0;

  filterChoice = ['Add a filter', 'Range of date', 'Location', 'Score range'];

  nodes = [
    {
      ID: 12,
      title: 'Graphs: methods',
      type: 'leaf',
      ring: false,
      state: 'started',
      progress: {
        displayedScore: 100,
        currentScore: 100,
      },
    },
    {
      ID: 13,
      title: 'List graph caracteristics',
      type: 'leaf',
      ring: false,
      state: 'never opened',
      progress: {
        displayedScore: 0,
        currentScore: 0,
      },
    },
    {
      ID: 14,
      title: 'Reduce graph size',
      type: 'folder',
      ring: false,
      state: 'opened',
      progress: {
        displayedScore: 90,
        currentScore: 90,
      },
    },
    {
      ID: 24,
      title: 'Flood Fill',
      type: 'leaf',
      ring: false,
      state: 'opened',
      progress: {
        displayedScore: 70,
        currentScore: 70,
        icons: 'camera',
      },
    },
  ];

  constructor() {}

  ngOnInit() {}

  onSelectionChanged(e) {
    this.selected = e;
  }

  removeFilter(id) {
    this.gridFilters = this.gridFilters.filter((el) => {
      return el.ID !== id;
    });
  }
}
