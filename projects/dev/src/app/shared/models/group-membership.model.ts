import { Group } from './group.model';

export interface GroupMembership {
  action: string;
  member_since: Date;
  group: Group;
}
