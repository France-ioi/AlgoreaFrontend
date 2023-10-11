import { Component, Input } from '@angular/core';
import { GroupShortInfo } from '../../data-access/get-group-by-id.service';
import { GroupLinkPipe } from 'src/app/pipes/groupLink';
import { RouterLink } from '@angular/router';
import { NgFor, NgIf, SlicePipe } from '@angular/common';

const MAX_ITEMS_DISPLAY = 4;

@Component({
  selector: 'alg-group-links',
  templateUrl: './group-links.component.html',
  styleUrls: [ './group-links.component.scss' ],
  standalone: true,
  imports: [ NgFor, RouterLink, NgIf, SlicePipe, GroupLinkPipe ]
})
export class GroupLinksComponent {
  @Input() items?: GroupShortInfo[];

  maxItemsDisplay = MAX_ITEMS_DISPLAY;

  constructor() { }

}
