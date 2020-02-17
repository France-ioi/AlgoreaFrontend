import { Component, OnInit, Input, ContentChild } from '@angular/core';

@Component({
  selector: 'app-section-paragraph',
  templateUrl: './section-paragraph.component.html',
  styleUrls: ['./section-paragraph.component.scss']
})
export class SectionParagraphComponent implements OnInit {
  @Input() icon;
  @Input() label;
  @Input() collapsible = false;
  @Input() theme = 'success';
  @Input() hasBorder = false;
  @Input() data;

  @ContentChild('headerTemplate', { static: false }) headerTemplate;

  visible;

  constructor() { }

  ngOnInit() {
    this.visible = this.collapsible;
  }

  toggleContent(e) {
    this.visible = !this.visible;
  }

}
