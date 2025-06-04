import { Pipe, PipeTransform } from '@angular/core';
import { GroupManagershipLevel } from '../../models/group-management';
import { groupManagershipLevelEnum as l } from '../../models/group-management';

function managementLevelAsText(level: GroupManagershipLevel): string {
  switch (level) {
    case l.none:
      return $localize`Read-only`;
    case l.memberships:
      return $localize`Memberships`;
    case l.memberships_and_group:
      return $localize`Memberships and group`;
  }
}

@Pipe({ name: 'managementLevelAsText', pure: true, standalone: true })
export class ManagementLevelAsTextPipe implements PipeTransform {
  transform = managementLevelAsText;
}
