import { Component, OnInit, ElementRef } from '@angular/core';

@Component({
  selector: 'app-yourself-tab',
  templateUrl: './yourself-tab.component.html',
  styleUrls: ['./yourself-tab.component.scss']
})
export class YourselfTabComponent implements OnInit {

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

  constructor(
    private elementRef: ElementRef
  ) { }

  ngOnInit() {
  }

  onTabChange(e) {
    const tabs = this.elementRef.nativeElement.querySelectorAll('.mat-tab-labels .mat-tab-label');
    let i;
    const activeTab = this.elementRef.nativeElement.querySelector('.mat-tab-labels .mat-tab-label.mat-tab-label-active');
    tabs.forEach((tab) => {
      tab.classList.remove('mat-tab-label-before-active');
    });

    for (i = 0 ; i < tabs.length ; i++) {
      if (tabs[i] === activeTab) {
        break;
      }
    }

    if (i > 0) {
      tabs[i - 1].classList.add('mat-tab-label-before-active');
    }
  }

}
