import { Component, OnInit, Input } from '@angular/core';

@Component({
  selector: 'app-session-view',
  templateUrl: './session-view.component.html',
  styleUrls: ['./session-view.component.scss']
})
export class SessionViewComponent implements OnInit {

  @Input() data;

  constructor() { }

  ngOnInit() {
  }

}
