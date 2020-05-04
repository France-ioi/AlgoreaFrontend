import { Component, OnInit, Input } from '@angular/core';

@Component({
  selector: 'app-presentation-item',
  templateUrl: './presentation-item.component.html',
  styleUrls: ['./presentation-item.component.scss']
})
export class PresentationItemComponent implements OnInit {

  @Input() data;

  constructor() { }

  ngOnInit() {
  }

}
