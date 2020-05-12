import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-yourself-personal',
  templateUrl: './yourself-personal.component.html',
  styleUrls: ['./yourself-personal.component.scss']
})
export class YourselfPersonalComponent implements OnInit {

  personal = [
    {
      field: 'Login',
      value: 'CyrilK67'
    },
    {
      field: 'First name',
      value: 'Cyril'
    },
    {
      field: 'Last name',
      value: 'Kitsch'
    },
    {
      field: 'Display my real name on my public profile',
      value: 'non'
    },
    {
      field: 'Birth date',
      value: '24/12/1985'
    },
    {
      field: 'Student ID',
      value: '568DH8H9'
    },
    {
      field: 'Sex',
      value: 'Mascuin'
    },
    {
      field: 'Nationality',
      value: 'France'
    },
    {
      field: 'Personal Web page',
      value: 'www.cyrilk.com'
    }
  ];

  school = [
    {
      field: 'Your grade',
      value: 'Terminale'
    },
    {
      field: 'Highschool graduation year',
      value: '2019'
    },
    {
      field: 'Residence country',
      value: 'France'
    },
    {
      field: 'Role',
      value: 'Etudiant'
    }
  ];

  contact = [
    {
      field: 'Primary email',
      value: 'cyrilk@mail.com'
    },
    {
      field: 'Secondary email',
      value: 'cyril.kitsch@academy.org'
    },
    {
      field: 'Address',
      value: '34, rue des tulipes'
    },
    {
      field: 'City',
      value: 'PARIS'
    },
    {
      field: 'Zipcode',
      value: '75020'
    },
    {
      field: 'Primary phone number',
      value: '06 45 37 69 80'
    },
    {
      field: 'Secondary phone number',
      value: '07 65 74 83 93'
    }
  ];

  parameters = [
    {
      field: 'Language',
      value: 'French'
    },
    {
      field: 'Time zone',
      value: 'Paris (GMT+1)'
    }
  ];

  constructor() { }

  ngOnInit() {
  }

}
