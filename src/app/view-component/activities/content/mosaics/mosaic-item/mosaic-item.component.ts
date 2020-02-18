import { Component, OnInit, Input } from '@angular/core';

@Component({
  selector: 'app-mosaic-item',
  templateUrl: './mosaic-item.component.html',
  styleUrls: ['./mosaic-item.component.scss']
})
export class MosaicItemComponent implements OnInit {

  @Input() data;

  constructor() { }

  ngOnInit() {
  }

}
