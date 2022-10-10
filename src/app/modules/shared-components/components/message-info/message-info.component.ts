import { Component, Input } from '@angular/core';

@Component({
  selector: 'alg-message-info',
  templateUrl: './message-info.component.html',
  styleUrls: [ 'message-info.component.scss' ],
})
export class MessageInfoComponent {
  @Input() icon = 'pi pi-exclamation-circle';

  constructor() {
  }
}
