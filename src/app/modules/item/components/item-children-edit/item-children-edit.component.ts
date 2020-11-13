import { Component, OnInit, Input } from '@angular/core';
import { ItemChild } from '../../http-services/get-item-children.service';

interface ChapterData {
  order: number,
  chapter: ItemChild
}

@Component({
  selector: 'alg-item-children-edit',
  templateUrl: './item-children-edit.component.html',
  styleUrls: [ './item-children-edit.component.scss' ]
})
export class ItemChildrenEditComponent implements OnInit {

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
