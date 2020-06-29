import { Component, OnInit, Input, ContentChild } from '@angular/core';

@Component({
  selector: 'alg-sub-grid',
  templateUrl: './sub-grid.component.html',
  styleUrls: ['./sub-grid.component.scss'],
})
export class SubGridComponent implements OnInit {
  @Input() data;

  @ContentChild('bodyTemplate') bodyTemplate;

  constructor() {}

  ngOnInit() {}
}
