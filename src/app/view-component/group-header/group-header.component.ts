import { Component, OnInit, Input, OnChanges, SimpleChanges, HostListener, ViewChild } from '@angular/core';
import * as converter from 'number-to-words';

@Component({
  selector: 'app-group-header',
  templateUrl: './group-header.component.html',
  styleUrls: ['./group-header.component.scss']
})
export class GroupHeaderComponent implements OnInit, OnChanges {

  @Input() isScrolled;
  @Input() isFolded;
  @Input() isStarted;
  @Input() isCollapsed;
  @Input() data;

  @ViewChild('userInfo', { static: false }) userInfo;

  ID;

  isTwoColumn = false;
  grades;
  visibleAssoc = true;

  gradingRequests = [
    {
      user: 'BorisKarlo',
      subject: 'LoremIpsum'
    },
    {
      user: 'PaulGogo',
      subject: 'LoremIpsum'
    },
    {
      user: 'Marionduv',
      subject: 'LoremIpsum'
    },
    {
      user: 'Bestof',
      subject: 'LoremIpsum'
    },
    {
      user: 'SimSim',
      subject: 'LoremIpsum'
    },
    {
      user: 'Mamaschmitt',
      subject: 'LoremIpsum'
    }
  ];

  pendingRequests = [
    {
      user: {
        image: 'assets/images/_messi.jpg',
        name: 'DUJARDIN Jean (Jeandu88)',
        activity: 'Terminale',
        content: 'Led ac magna suscipit, sollicitudin urna at, firibus ipsum, Nulla ullarncoper vulputate nisl. Aenean in ex nisl, Suspendisse magna tortor sagittis quis.'
      },
      date: new Date(2019, 12, 31)
    },
    {
      user: {
        image: 'assets/images/_messi.jpg',
        name: 'DENIS Marie-Sophie (MadameSoso)',
        activity: 'Terminale',
        content: 'Led ac magna suscipit, sollicitudin urna at, firibus ipsum, Nulla ullarncoper vulputate nisl. Aenean in ex nisl, Suspendisse magna tortor sagittis quis.'
      },
      date: new Date(2020, 1, 24)
    },
    {
      user: {
        image: 'assets/images/_messi.jpg',
        name: 'GASTARD Frederique (FredGast)',
        activity: 'Terminale',
        content: 'Led ac magna suscipit, sollicitudin urna at, firibus ipsum, Nulla ullarncoper vulputate nisl. Aenean in ex nisl, Suspendisse magna tortor sagittis quis.'
      },
      date: new Date(2020, 2, 12)
    }
  ];

  columns = [
    { field: 'user', header: 'user' },
    { field: 'date', header: 'requested on' }
  ];
  
  grdata = [
    {
      name: 'Epreuves',
      columns: this.columns
    }
  ];

  groupSwitch = [
    {
      label: 'This group only'
    },
    {
      label: 'All subgroups'
    }
  ];

  constructor() { }

  ngOnInit() {
    if (Object.keys(this.data).length > 3) {
      this.isTwoColumn = true;
    }
    this.ID = this.data.ID;
  }

  ngOnChanges(changes: SimpleChanges) {
    if (this.data) {
      this.grades = [];
      this.data.grades.forEach(grade => {
        this.grades.push(converter.toWords(grade));
      });
    }
  }

  @HostListener('window:resize', ['$event'])
  onResized(e) {
    console.log(this.userInfo);
    if (this.userInfo.nativeElement.offsetWidth <= 650) {
      this.visibleAssoc = false;
    } else {
      this.visibleAssoc = true;
    }
  }

  onExpandWidth(e) {
    
  }

}
