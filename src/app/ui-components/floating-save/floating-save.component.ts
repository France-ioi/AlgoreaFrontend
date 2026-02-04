import { Component, ElementRef, EventEmitter, Input, OnDestroy, OnInit, Output, Renderer2, inject } from '@angular/core';
import { ButtonComponent } from 'src/app/ui-components/button/button.component';

@Component({
  selector: 'alg-floating-save',
  templateUrl: './floating-save.component.html',
  styleUrls: [ './floating-save.component.scss' ],
  imports: [ ButtonComponent ]
})
export class FloatingSaveComponent implements OnInit, OnDestroy {
  private renderer = inject(Renderer2);
  private el = inject<ElementRef<HTMLDivElement>>(ElementRef);

  @Input() saving = false;
  @Output() save = new EventEmitter<void>();
  @Output() cancel = new EventEmitter<void>();

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
