import { Component, OnInit, Input } from '@angular/core';

@Component({
  selector: 'app-log-view-grid',
  templateUrl: './log-view-grid.component.html',
  styleUrls: ['./log-view-grid.component.scss']
})
export class LogViewGridComponent implements OnInit {

  @Input() data;
  @Input() cols;
  @Input() type;

  constructor() { }

  ngOnInit() {
  }

}
