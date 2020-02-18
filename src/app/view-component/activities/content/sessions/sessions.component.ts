import { Component, OnInit, Input } from '@angular/core';

@Component({
  selector: 'app-sessions',
  templateUrl: './sessions.component.html',
  styleUrls: ['./sessions.component.scss']
})
export class SessionsComponent implements OnInit {

  @Input() sessions;
  @Input() filterTypes;
  @Input() filters;

  constructor() { }

  ngOnInit() {
  }

  removeFilter(id) {
    this.filters = this.filters.filter(el => {
      return el.ID !== id;
    });
  }

}
