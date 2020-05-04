import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-yourself-overview',
  templateUrl: './yourself-overview.component.html',
  styleUrls: ['./yourself-overview.component.scss']
})
export class YourselfOverviewComponent implements OnInit {

  griddata = [
    {
      task: 'Espion etranger',
      chapter: 'Chapter 1',
      grade: 'Terminale',
      date: new Date(2018, 4, 23)
    },
    {
      task: 'Espion etranger',
      chapter: 'Chapter 1',
      grade: 'Terminale',
      date: new Date(2018, 4, 23)
    },
    {
      task: 'Espion etranger',
      chapter: 'Chapter 1',
      grade: 'Terminale',
      date: new Date(2018, 4, 23)
    },
    {
      task: 'Espion etranger',
      chapter: 'Chapter 1',
      grade: 'Terminale',
      date: new Date(2018, 4, 23)
    },
    {
      task: 'Espion etranger',
      chapter: 'Chapter 1',
      grade: 'Terminale',
      date: new Date(2018, 4, 23)
    },
    {
      task: 'Espion etranger',
      chapter: 'Chapter 1',
      grade: 'Terminale',
      date: new Date(2018, 4, 23)
    },
    {
      task: 'Espion etranger',
      chapter: 'Chapter 1',
      grade: 'Terminale',
      date: new Date(2018, 4, 23)
    },
    {
      task: 'Espion etranger',
      chapter: 'Chapter 1',
      grade: 'Terminale',
      date: new Date(2018, 4, 23)
    },
    {
      task: 'Espion etranger',
      chapter: 'Chapter 1',
      grade: 'Terminale',
      date: new Date(2018, 4, 23)
    },
    {
      task: 'Espion etranger',
      chapter: 'Chapter 1',
      grade: 'Terminale',
      date: new Date(2018, 4, 23)
    },
  ];

  columns = [
    { field: 'task', header: 'Task' },
    { field: 'chapter', header: 'Chapter' },
    { field: 'grade', header: 'Grade' },
    { field: 'date', header: 'Date' }
  ];

  panels = [
    {
      name: 'Group',
      columns: this.columns
    }
  ];

  awardList = [
    {
      year: 2015,
      type: 'bronze'
    },
    {
      year: 2016,
      type: 'silver'
    },
    {
      year: 2017,
      type: 'gold'
    },
    {
      year: 2018,
      type: 'bronze'
    }
  ];

  constructor() { }

  ngOnInit() {
  }

  onExpandWidth(e) {
    
  }

}
