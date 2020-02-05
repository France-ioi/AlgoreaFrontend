import { Component, OnInit, Input } from '@angular/core';

@Component({
  selector: 'app-sub-section',
  templateUrl: './sub-section.component.html',
  styleUrls: ['./sub-section.component.scss']
})
export class SubSectionComponent implements OnInit {
  @Input() icon;
  @Input() title;
  @Input() tooltip;

  constructor() { }

  ngOnInit() {
  }

}
