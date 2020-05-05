import { Component, OnInit, Input } from '@angular/core';

@Component({
  selector: 'app-grading-request-view',
  templateUrl: './grading-request-view.component.html',
  styleUrls: ['./grading-request-view.component.scss']
})
export class GradingRequestViewComponent implements OnInit {

  @Input() data;

  constructor() { }

  ngOnInit() {
  }

}
