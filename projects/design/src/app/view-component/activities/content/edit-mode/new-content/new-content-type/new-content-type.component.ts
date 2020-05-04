import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-new-content-type',
  templateUrl: './new-content-type.component.html',
  styleUrls: ['./new-content-type.component.scss']
})
export class NewContentTypeComponent implements OnInit {

  @Input() data;

  @Output() onClick = new EventEmitter<any>();

  constructor() { }

  ngOnInit() {
  }

}
