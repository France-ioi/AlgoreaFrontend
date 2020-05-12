import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'lib-notification-view',
  templateUrl: './notification-view.component.html',
  styleUrls: ['./notification-view.component.scss']
})
export class NotificationViewComponent implements OnInit {

  notifications = [
    {
      icon: 'fa fa-users',
      desc: 'Concours Algorea: 10 personnes ...',
      type: 'Demande',
      date: new Date()
    },
    {
      icon: 'fa fa-envelope',
      desc: 'Concours Algorea: 10 personnes ...',
      type: 'Demande',
      date: new Date()
    },
    {
      icon: 'fa fa-sign-out-alt',
      desc: 'Concours Algorea: 10 personnes ...',
      type: 'Demande',
      date: new Date()
    },
    {
      icon: 'fa fa-check',
      desc: 'Concours Algorea: 10 personnes ...',
      type: 'Demande',
      date: new Date()
    },
    {
      icon: 'fa fa-glasses',
      desc: 'Concours Algorea: 10 personnes ...',
      type: 'Demande',
      date: new Date()
    },
    {
      icon: 'fa fa-graduation-cap',
      desc: 'Concours Algorea: 10 personnes ...',
      type: 'Demande',
      date: new Date()
    },
    {
      icon: 'fa fa-users',
      desc: 'Concours Algorea: 10 personnes ...',
      type: 'Demande',
      date: new Date()
    },
  ];

  cols = [
    { field: 'desc', header: 'Description' },
    { field: 'type', header: 'Type' },
    { field: 'date', header: 'Date' }
  ];

  panels = [
    {
      name: 'Panel',
      columns: this.cols
    }
  ];

  constructor() { }

  ngOnInit() {
  }

}
