import { Component, ElementRef, EventEmitter, Input, OnDestroy, OnInit, Output, Renderer2 } from '@angular/core';
import { ButtonModule } from 'primeng/button';

@Component({
  selector: 'alg-floating-save',
  templateUrl: './floating-save.component.html',
  styleUrls: [ './floating-save.component.scss' ],
  standalone: true,
  imports: [ ButtonModule ]
})
export class FloatingSaveComponent implements OnInit, OnDestroy {

  @Input() saving = false;
  @Output() save = new EventEmitter<void>();
  @Output() cancel = new EventEmitter<void>();

  constructor(private renderer: Renderer2, private el: ElementRef<HTMLDivElement>) {}

  ngOnInit(): void {
    const deleteButtonWrapperHeight = this.el.nativeElement.clientHeight;
    const contentEl = document.querySelector('.main-content');

    if (!contentEl) {
      throw new Error('Unexpected: Missed .main-content element');
    }

    this.renderer.setStyle(contentEl, 'padding-bottom', `${deleteButtonWrapperHeight}px`);
  }

  ngOnDestroy(): void {
    const contentEl = document.querySelector('.main-content');

    if (!contentEl) {
      throw new Error('Unexpected: Missed .main-content element');
    }

    this.renderer.removeStyle(contentEl, 'padding-bottom');
  }

  onSave(): void {
    this.save.emit();
  }

  onCancel(): void {
    this.cancel.emit();
  }
}
