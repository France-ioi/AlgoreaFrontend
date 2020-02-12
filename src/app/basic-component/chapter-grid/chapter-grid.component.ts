import { Component, OnInit, Input } from '@angular/core';

@Component({
  selector: 'app-chapter-grid',
  templateUrl: './chapter-grid.component.html',
  styleUrls: ['./chapter-grid.component.scss']
})
export class ChapterGridComponent implements OnInit {

  @Input() data;
  @Input() cols;
  @Input() scoreWeight;

  orderable = true;
  icons = [
    'fa fa-lock',
    'fa fa-lock',
    'fa fa-lock'
  ];

  constructor() { }

  ngOnInit() {
  }

  toggleLock(e) {
    this.orderable = !this.orderable;
  }

  menuSelected(e, idx, which) {
    switch (which) {
      case 0:
        this.icons[idx] = 'fa fa-eye-slash';
        break;
      case 1:
        this.icons[idx] = 'fa fa-lock';
        break;
      default:
        this.icons[idx] = 'fa fa-eye';
        break;
    }
  }

}
