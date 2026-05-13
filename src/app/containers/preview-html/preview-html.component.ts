import { Component, Input, inject } from '@angular/core';
import { DescriptionIframeComponent } from 'src/app/ui-components/description-iframe/description-iframe.component';
import { DescriptionIframeNavigationRequest } from 'src/app/ui-components/description-iframe/description-iframe.messages';
import { MessageService } from 'src/app/services/message.service';

@Component({
  selector: 'alg-preview-html',
  templateUrl: './preview-html.component.html',
  styleUrls: [ './preview-html.component.scss' ],
  imports: [ DescriptionIframeComponent ],
})
export class PreviewHtmlComponent {
  private messageService = inject(MessageService);

  @Input() textContent = '';

  /**
   * Preview is for editing a (possibly unsaved) item — we never actually navigate. Surface the
   * intent as an info toast instead, so editors can validate that their `data-item-id` /
   * `data-url` anchors are wired correctly.
   */
  onPreviewNavigate(req: DescriptionIframeNavigationRequest): void {
    let detail: string;
    if ('url' in req) {
      detail = $localize`:@@previewNavToUrl:Navigate to ${req.url}:url: in a new tab`;
    } else if (req.child) {
      detail = $localize`:@@previewNavToChildItem:Navigate to item ${req.itemId}:itemId: (as a child of the current item)`;
    } else {
      detail = $localize`:@@previewNavToItem:Navigate to item ${req.itemId}:itemId:`;
    }
    this.messageService.add({ severity: 'info', detail });
  }
}
