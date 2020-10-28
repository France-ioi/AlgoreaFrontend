import {
  Component,
  OnInit,
  Input,
  ContentChild,
  Output,
  EventEmitter,
  TemplateRef,
} from '@angular/core';

@Component({
  selector: 'alg-section-paragraph',
  templateUrl: './section-paragraph.component.html',
  styleUrls: [ './section-paragraph.component.scss' ],
})
export class SectionParagraphComponent implements OnInit {
  @Input() icon?: string;
  @Input() label = '';
  @Input() collapsible = false;
  @Input() theme = 'success';
  @Input() hasBorder = false;
  @Input() data: any;
  @Input() remainOrigin = true;
  @Input() collapsed = false;


  @Output() collapse = new EventEmitter<boolean>();

  @ContentChild('headerTemplate') headerTemplate?: TemplateRef<any>;

  constructor() {}

  ngOnInit(): void {
  }

  toggleContent(): void {
    this.collapsed = !this.collapsed;
    this.collapse.emit(this.collapsed);
  }
}
