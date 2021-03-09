import { ItemType } from 'src/app/shared/helpers/item-type';

type ActivityId = string;

export interface NoActivity {type: 'no-activity'}

export interface NewActivity {type: 'new-activity', name: string, itemType: ItemType}

export interface ExistingActivity {type: 'existing-activity', id: ActivityId}

export function isExistingActivity(activity: NoActivity|NewActivity|ExistingActivity): activity is ExistingActivity {
  return activity.type === 'existing-activity';
}

export function isNewActivity(activity: NoActivity|NewActivity|ExistingActivity): activity is NewActivity {
  return activity.type === 'new-activity';
}
