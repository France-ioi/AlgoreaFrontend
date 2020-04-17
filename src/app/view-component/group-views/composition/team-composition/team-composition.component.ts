import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-team-composition',
  templateUrl: './team-composition.component.html',
  styleUrls: ['./team-composition.component.scss']
})
export class TeamCompositionComponent implements OnInit {

  team = [
    {
      name: 'Tikikoo',
      first_name: 'Tatiana',
      last_name: 'Kirckpatrick',
      image: '_messi.jpg',
      school: 'Terminale',
      creator: true,
      date: new Date()
    },
    {
      name: 'Tikikoo',
      first_name: 'Tatiana',
      last_name: 'Kirckpatrick',
      image: '_messi.jpg',
      school: 'Terminale',
      creator: false,
      date: new Date()
    },
    {
      name: 'Tikikoo',
      first_name: 'Tatiana',
      last_name: 'Kirckpatrick',
      image: '_messi.jpg',
      school: 'Terminale',
      creator: false,
      date: new Date()
    },
    {
      name: 'Tikikoo',
      first_name: 'Tatiana',
      last_name: 'Kirckpatrick',
      image: '_messi.jpg',
      school: 'Terminale',
      creator: false,
      date: new Date()
    },
    {
      name: 'Tikikoo',
      first_name: 'Tatiana',
      last_name: 'Kirckpatrick',
      image: '_messi.jpg',
      school: 'Terminale',
      creator: false,
      date: new Date()
    },
    {
      name: 'Tikikoo',
      first_name: 'Tatiana',
      last_name: 'Kirckpatrick',
      image: '_messi.jpg',
      school: 'Terminale',
      creator: false,
      date: new Date()
    },
    {
      name: 'Tikikoo',
      first_name: 'Tatiana',
      last_name: 'Kirckpatrick',
      image: '_messi.jpg',
      school: 'Terminale',
      creator: false,
      date: new Date()
    },
  ];

  constructor() { }

  ngOnInit() {
  }

}
