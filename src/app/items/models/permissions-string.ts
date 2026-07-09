import { TypeFilter } from './composition-filter';
import { ConstraintError } from './item-permissions-constraints';

export const permissionsInfoString = {
  canView: {
    string: $localize`Can view`,
    none: $localize`Nothing`,
    info: $localize`Info`,
    content: $localize`Content`,
    content_with_descendants: $localize`Content and descendants`,
    solution: $localize`Solution`,
  },
  canGrantView: {
    string: $localize`Can grant view`,
    none: $localize`Nothing`,
    enter: $localize`Info & enter`,
    content: $localize`Content`,
    content_with_descendants: $localize`Content and descendants`,
    solution: $localize`Solution`,
    solution_with_grant: $localize`Solution and grant`,
  },
  canWatch: {
    string: $localize`Can watch`,
    none: $localize`Nothing`,
    result: $localize`Result`,
    answer: $localize`Answer`,
    answer_with_grant: $localize`Answer and grant`,
  },
  canEdit: {
    string: $localize`Can edit`,
    none: $localize`Nothing`,
    children: $localize`Children`,
    all: $localize`All`,
    all_with_grant: $localize`All and grant`,
  }
};

const multipleValuesPermissions = [ 'canView', 'canGrantView', 'canWatch', 'canEdit' ] as const;

function isMultipleValuesPermissionConstraint(
  constraintError: ConstraintError
): constraintError is ConstraintError<typeof multipleValuesPermissions[number]> {
  return multipleValuesPermissions.includes(constraintError.permission as typeof multipleValuesPermissions[number]);
}

export function generateErrorMessage(_targetType: TypeFilter) {
  return (constraintError: ConstraintError): string => {
    if (isMultipleValuesPermissionConstraint(constraintError)) {
      const permissionString = permissionsInfoString[constraintError.permission];
      const permission = permissionString.string;
      const permissionValue = permissionString[constraintError.expectedValue as keyof typeof permissionString];
      const atLeast = constraintError.constraintType === 'atLeast';

      if (constraintError.on === 'giver') {
        if (atLeast) return $localize`Insufficient permissions. You need ${permission} >= "${permissionValue}"`;
        else return $localize`Insufficient permissions. You need ${permission} = "${permissionValue}"`;
      } else {
        if (atLeast) return $localize`This requires "${permission}" to be at least "${permissionValue}"`;
        else return $localize`This requires "${permission}" to be "${permissionValue}"`;
      }
    }

    if (constraintError.permission === 'isOwner' && constraintError.expectedValue === true) {
      return $localize`You need to be owner of this item`;
    }

    throw new Error('Unexpected constraint error on permissions');
  };
}
