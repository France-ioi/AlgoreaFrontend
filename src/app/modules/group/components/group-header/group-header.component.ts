import { Component, Input } from '@angular/core';
import { CurrentContentService, EditAction } from 'src/app/shared/services/current-content.service';
import { Group } from '../../http-services/get-group-by-id.service';

@Component({
  selector: 'alg-group-header',
  templateUrl: './group-header.component.html',
  styleUrls: [ './group-header.component.scss' ],
})
export class GroupHeaderComponent {
  @Input() group?: Group;

  constructor(
    private currentContent: CurrentContentService,
  ) {}

  onEditButtonClicked(): void {
    this.currentContent.editAction.next(EditAction.StartEditing);
  }
}
