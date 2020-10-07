import { Component, OnDestroy } from '@angular/core';
import { CurrentContentService } from 'src/app/shared/services/current-content.service';

@Component({
  selector: 'alg-item-edit',
  templateUrl: './item-edit.component.html',
  styleUrls: ['./item-edit.component.scss']
})
export class ItemEditComponent implements OnDestroy {

  constructor(
    private currentContent: CurrentContentService,
  ) {
    this.currentContent.editState.next('editing');
  }

  ngOnDestroy() {
    this.currentContent.editState.next('non-editable');
  }

}
