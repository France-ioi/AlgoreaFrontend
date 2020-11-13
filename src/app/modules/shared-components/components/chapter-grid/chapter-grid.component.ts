import { Component, OnInit, Input } from '@angular/core';
import { ItemChild } from '../../../item/http-services/get-item-children.service';

interface ChapterData {
  order: number,
  chapter: ItemChild
}

@Component({
  selector: 'alg-chapter-grid',
  templateUrl: './chapter-grid.component.html',
  styleUrls: [ './chapter-grid.component.scss' ]
})
export class ChapterGridComponent implements OnInit {

  @Input() data: ItemChild[] = [];
  @Input() scoreWeight?: number;

  chapterData: ChapterData[] = [];
  lockState = 1;

  constructor() {
  }

  ngOnInit(): void {
    this.chapterData = this.data.map((elm, idx) => ({ order: idx, chapter: elm }));
  }

}
