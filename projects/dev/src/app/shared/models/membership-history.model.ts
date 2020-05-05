import { Group } from './group.model';

export interface MembershipHistory {
  action: string;
  at: Date;
  group: Group;
}