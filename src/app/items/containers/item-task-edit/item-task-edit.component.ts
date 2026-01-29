import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges, inject } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { FullHeightContentDirective } from 'src/app/directives/full-height-content.directive';


@Component({
  selector: 'alg-item-task-edit',
  templateUrl: './item-task-edit.component.html',
  styleUrls: [ './item-task-edit.component.scss' ],
  imports: [ FullHeightContentDirective ]
})
export class ItemTaskEditComponent implements OnChanges {
  private sanitizer = inject(DomSanitizer);

  @Input() editorUrl?: string;
  @Output() redirectToDefaultTab = new EventEmitter<void>();

  sanitizedUrl?: SafeResourceUrl;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.editorUrl) {
      this.sanitizedUrl = this.editorUrl ? this.sanitizer.bypassSecurityTrustResourceUrl(this.editorUrl) : undefined;
      if (!this.sanitizedUrl) this.redirectToDefaultTab.emit();
    }
  }

}
