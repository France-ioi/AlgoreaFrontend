import { Component, OnInit, Input } from '@angular/core';

@Component({
  selector: 'app-new-content',
  templateUrl: './new-content.component.html',
  styleUrls: ['./new-content.component.scss']
})
export class NewContentComponent implements OnInit {

  @Input() data;

  constructor() { }

  ngOnInit() {
  }

}
