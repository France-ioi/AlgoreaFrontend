import { pipe } from 'fp-ts/function';
import * as D from 'io-ts/Decoder';

const managershipOpts = {
  none: 'none',
  direct: 'direct',
  ancestor: 'ancestor',
  descendant: 'descendant',
};

const managementLevelOpts = {
  none: 'none',
  memberships: 'memberships',
  membershipsAndGroup: 'memberships_and_group'
};

export const groupManagershipDecoder = pipe(
  D.struct({
    currentUserManagership: D.literal(managershipOpts.none, managershipOpts.descendant, managershipOpts.direct, managershipOpts.ancestor),
  }),
  D.intersect(
    D.partial({
      currentUserCanGrantGroupAccess: D.boolean,
      currentUserCanManage: D.literal(managementLevelOpts.none, managementLevelOpts.memberships, managementLevelOpts.membershipsAndGroup),
      currentUserCanWatchMembers: D.boolean,
    })
  )
);

type GroupManagership = D.TypeOf<typeof groupManagershipDecoder>;

function isCurrentUserManager<T extends GroupManagership>(g: T): boolean {
  return [ managershipOpts.direct, managershipOpts.ancestor ].includes(g.currentUserManagership);
}

export function canCurrentUserGrantGroupAccess<T extends GroupManagership>(g: T): boolean {
  return !!g.currentUserCanGrantGroupAccess;
}

export function canCurrentUserManageMembers<T extends GroupManagership>(g: T): boolean {
  return !!g.currentUserCanManage &&
    [ managementLevelOpts.memberships, managementLevelOpts.membershipsAndGroup ].includes(g.currentUserCanManage);
}

export function canCurrentUserManageGroup<T extends GroupManagership>(g: T): boolean {
  return g.currentUserCanManage === managementLevelOpts.membershipsAndGroup;
}

export interface ManagementAdditions {
  isCurrentUserManager: boolean,
  canCurrentUserManageMembers: boolean,
  canCurrentUserManageGroup: boolean,
}

// Adds to the given group some new computed attributes (as value)
// The resulting object can be used in templates as value will not be recomputed
export function withManagementAdditions<T extends GroupManagership>(g: T): T & ManagementAdditions {
  return {
    ...g,
    isCurrentUserManager: isCurrentUserManager(g),
    canCurrentUserManageMembers: canCurrentUserManageMembers(g),
    canCurrentUserManageGroup: canCurrentUserManageGroup(g),
  };
}
