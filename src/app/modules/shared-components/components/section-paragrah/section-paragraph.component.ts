import {
  Component,
  OnInit,
  Input,
  ContentChild,
  Output,
  EventEmitter,
} from '@angular/core';

@Component({
  selector: 'alg-section-paragraph',
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

  @Output() collapse = new EventEmitter<any>();

  @ContentChild('headerTemplate') headerTemplate;

  visible;

  constructor() {}

  ngOnInit() {
    this.visible = this.collapsible;
  }

  toggleContent() {
    this.visible = !this.visible;
    this.collapse.emit(this.visible);
  }
}
