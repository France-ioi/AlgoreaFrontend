import { Component, OnInit, Input } from '@angular/core';

@Component({
  selector: 'app-presentations',
  templateUrl: './presentations.component.html',
  styleUrls: ['./presentations.component.scss']
})
export class PresentationsComponent implements OnInit {

  @Input() data;

  constructor() { }

  ngOnInit() {
  }

}
