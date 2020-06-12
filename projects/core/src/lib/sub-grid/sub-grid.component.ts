import { Component, OnInit, Input, ContentChild } from '@angular/core';

@Component({
  selector: 'app-sub-grid',
  templateUrl: './sub-grid.component.html',
  styleUrls: ['./sub-grid.component.scss'],
})
export class SubGridComponent implements OnInit {
  @Input() data;

  @ContentChild('bodyTemplate', { static: false }) bodyTemplate;

  constructor() {}

  ngOnInit() {}
}
