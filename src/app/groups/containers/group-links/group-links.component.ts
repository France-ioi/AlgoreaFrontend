import { Component, input } from '@angular/core';
import { GroupShortInfo } from '../../models/group';
import { GroupLinkPipe } from 'src/app/pipes/groupLink';
import { RouterLink } from '@angular/router';
import { SlicePipe } from '@angular/common';

const defaultMaxItemsDisplay = 4;

@Component({
  selector: 'alg-group-links',
  templateUrl: './group-links.component.html',
  styleUrls: [ './group-links.component.scss' ],
  imports: [
    RouterLink,
    SlicePipe,
    GroupLinkPipe
  ]
})
export class GroupLinksComponent {

  items = input.required<GroupShortInfo[]>();
  maxItemsDisplay = input(defaultMaxItemsDisplay);

}
