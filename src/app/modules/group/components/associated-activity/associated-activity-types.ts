import { ItemFound } from 'src/app/modules/item/http-services/search-item.service';
import { ActivityType, ItemType } from 'src/app/shared/helpers/item-type';

type ActivityId = string;

export interface NoActivity { tag: 'no-activity' }

export interface NewActivity { tag: 'new-activity', name: string, activityType: ActivityType }

export interface ExistingActivity { tag: 'existing-activity', id: ActivityId }

export function isExistingActivity(activity: NoActivity|NewActivity|ExistingActivity): activity is ExistingActivity {
  return activity.tag === 'existing-activity';
}

export function isNewActivity(activity: NoActivity|NewActivity|ExistingActivity): activity is NewActivity {
  return activity.tag === 'new-activity';
}

export function isActivityFound(itemFound: ItemFound<ItemType>): itemFound is ItemFound<ActivityType> {
  return itemFound.type !== 'Skill';
}
