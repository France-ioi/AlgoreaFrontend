import { Component, OnInit, Input } from '@angular/core';

@Component({
  selector: 'app-chapter-grid',
  templateUrl: './chapter-grid.component.html',
  styleUrls: ['./chapter-grid.component.scss']
})
export class ChapterGridComponent implements OnInit {

  @Input() data;
  @Input() cols;

  constructor() { }

  ngOnInit() {
  }

}
