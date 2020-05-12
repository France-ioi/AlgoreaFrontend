import {
  Component,
  OnInit,
  Input,
  ContentChild,
  Output,
  EventEmitter,
} from '@angular/core';

@Component({
  selector: 'lib-section-paragraph',
  templateUrl: './section-paragraph.component.html',
  styleUrls: ['./section-paragraph.component.scss'],
})
export class SectionParagraphComponent implements OnInit {
  @Input() icon;
  @Input() label;
  @Input() collapsible = false;
  @Input() theme = 'success';
  @Input() hasBorder = false;
  @Input() data;
  @Input() remainOrigin = true;

  @Output() onCollapse = new EventEmitter<any>();

  @ContentChild('headerTemplate', { static: false }) headerTemplate;

  visible;

  constructor() {}

  ngOnInit() {
    this.visible = this.collapsible;
  }

  toggleContent(e) {
    this.visible = !this.visible;
    this.onCollapse.emit(this.visible);
  }
}
