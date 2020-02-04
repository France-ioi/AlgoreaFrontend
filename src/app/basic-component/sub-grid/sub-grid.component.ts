import { Component, OnInit, Input } from '@angular/core';

@Component({
  selector: 'app-sub-grid',
  templateUrl: './sub-grid.component.html',
  styleUrls: ['./sub-grid.component.scss']
})
export class SubGridComponent implements OnInit {

  @Input() data;
  @Input() cols;

  constructor() { }

  ngOnInit() {
  }

}
