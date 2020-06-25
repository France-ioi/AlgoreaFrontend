import { Component, OnInit, Input } from '@angular/core';

@Component({
  selector: 'alg-data-list',
  templateUrl: './data-list.component.html',
  styleUrls: ['./data-list.component.scss'],
})
export class DataListComponent implements OnInit {
  @Input() items;

  constructor() {}

  ngOnInit() {}
}
