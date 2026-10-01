import { Component, computed, input } from '@angular/core';
import { DatePipe } from '@angular/common';
import { Item } from 'src/app/data-access/get-item-by-id.service';
import { WatchedGroupPermissions } from 'src/app/items/models/item-permissions';
import {
  activityOpeningPeriod,
  allowsEntering,
  doesActivityAllowEnteringNow,
  isEnterPermissionRequired,
} from 'src/app/items/models/item-entering';
import { allowsViewingContent } from 'src/app/items/models/item-view-permission';
import { TimeZoneNamePipe } from 'src/app/pipes/timeZoneName';

export type AllowsEnteringStatus =
  | { kind: 'ifConditions' }
  | { kind: 'allows' }
  | { kind: 'notAllowed' };

@Component({
  selector: 'alg-item-entry-permission-info',
  templateUrl: './item-entry-permission-info.component.html',
  styleUrl: './item-entry-permission-info.component.scss',
  imports: [ DatePipe, TimeZoneNamePipe ],
})
export class ItemEntryPermissionInfoComponent {
  item = input.required<Item>();
  permissions = input.required<WatchedGroupPermissions>();
  isUser = input.required<boolean>();
  /** Evaluation time; parent passes a value frozen when item data changes. */
  now = input.required<Date>();

  protected readonly enterPermissionRequired = computed((): boolean => isEnterPermissionRequired(this.item()));

  protected readonly isUserOnly = computed((): boolean => this.item().entryParticipantType === 'User');

  protected readonly openingPeriod = computed(() => activityOpeningPeriod(this.item(), this.now()));

  protected readonly hasContentView = computed((): boolean => allowsViewingContent(this.permissions()));

  protected readonly canEnterWithPerms = computed((): boolean =>
    allowsEntering(this.permissions(), this.item(), this.now())
  );

  protected readonly allowsEnteringStatus = computed((): AllowsEnteringStatus | undefined => {
    if (!this.canEnterWithPerms() || this.hasContentView()) return undefined;
    const allowsNow = doesActivityAllowEnteringNow(this.item(), this.now());
    if (allowsNow === undefined) return { kind: 'ifConditions' };
    if (allowsNow === false) return { kind: 'notAllowed' };
    return { kind: 'allows' };
  });
}
