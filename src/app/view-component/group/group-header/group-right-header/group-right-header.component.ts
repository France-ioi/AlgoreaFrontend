import { Component, OnInit, Input } from '@angular/core';

@Component({
  selector: 'app-group-right-header',
  templateUrl: './group-right-header.component.html',
  styleUrls: ['./group-right-header.component.scss']
})
export class GroupRightHeaderComponent implements OnInit {

  @Input() data;

  constructor() { }

  ngOnInit() {
  }

}
