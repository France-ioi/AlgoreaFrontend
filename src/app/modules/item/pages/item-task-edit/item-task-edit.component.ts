import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

@Component({
  selector: 'alg-item-task-edit',
  templateUrl: './item-task-edit.component.html',
  styleUrls: [ './item-task-edit.component.scss' ]
})
export class ItemTaskEditComponent implements OnChanges {
  @Input() editorUrl?: string;
  @Output() redirectToDefaultTab = new EventEmitter<void>();

  sanitizedUrl?: SafeResourceUrl;

  constructor(
    private sanitizer: DomSanitizer,
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.editorUrl) {
      this.sanitizedUrl = this.editorUrl ? this.sanitizer.bypassSecurityTrustResourceUrl(this.editorUrl) : undefined;
      if (!this.sanitizedUrl) this.redirectToDefaultTab.emit();
    }
  }

}
