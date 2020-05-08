import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-group-overview',
  templateUrl: './group-overview.component.html',
  styleUrls: ['./group-overview.component.scss']
})
export class GroupOverviewComponent implements OnInit {

  griddata = [
    {
      task: 'Espion etranger',
      chapter: 'Chapter 1',
      grade: 'Terminale',
      date: new Date(2018, 4, 23)
    }
  ];

  columns = [
    { field: 'task', header: 'Task' },
    { field: 'chapter', header: 'Chapter' },
    { field: 'grade', header: 'Grade' },
    { field: 'date', header: 'Date' }
  ];

  panels = [
  ];

  constructor() { }

  ngOnInit() {
    this.panels.push(
      {
        name: 'Group',
        columns: this.columns
      }
    );
  }

  onExpandWidth(e) {

  }

}
