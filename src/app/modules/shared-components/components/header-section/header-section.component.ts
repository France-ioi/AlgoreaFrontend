import { Component, OnInit, Input } from '@angular/core';

@Component({
  selector: 'alg-header-section',
  templateUrl: './header-section.component.html',
  styleUrls: ['./header-section.component.scss'],
})
export class HeaderSectionComponent implements OnInit {
  @Input() icon;
  @Input() title;
  @Input() isCollapsible: boolean;
  @Input() isCollapsed: boolean;

  constructor() {}

  ngOnInit() {}

  onCollapse() {
    this.isCollapsed = !this.isCollapsed;
  }
}
