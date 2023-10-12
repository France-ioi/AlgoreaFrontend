import { NewContentType } from 'src/app/ui-components/add-content/add-content.component';
import { ActivityType, ItemType } from './item-type';

export const allowedNewActivityTypes: NewContentType<ActivityType>[] = [
  {
    type: 'Chapter',
    icon: 'fa fa-book',
    title: $localize`Chapter`,
    description: $localize`A new folder which can contain any activities.`,
  },
  {
    type: 'Task',
    icon: 'fa fa-code',
    title: $localize`Empty task`,
    description: $localize`A new task which will be configured later.`,
  },
  {
    type: 'Task',
    icon: 'fa fa-code',
    title: $localize`Task`,
    description: $localize`A new task configured with a given url.`,
    allowToAddUrl: true,
  },
];

export const skillNewType: NewContentType<ItemType> = {
  type: 'Skill',
  icon: 'fa fa-graduation-cap',
  title: $localize`Skill`,
  description: $localize`A new skill.`,
};

export function getAllowedNewItemTypes(options: {allowActivities?: boolean, allowSkills?: boolean}): NewContentType<ItemType>[] {
  return [
    ...(options.allowSkills ? [ skillNewType ] : []),
    ...(options.allowActivities ? allowedNewActivityTypes : []),
  ];
}
