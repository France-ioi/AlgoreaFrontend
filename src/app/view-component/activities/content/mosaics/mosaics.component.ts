import { Component, OnInit, Input } from '@angular/core';

@Component({
  selector: 'app-mosaics',
  templateUrl: './mosaics.component.html',
  styleUrls: ['./mosaics.component.scss']
})
export class MosaicsComponent implements OnInit {

  @Input() data;

  constructor() { }

  ngOnInit() {
  }

}
