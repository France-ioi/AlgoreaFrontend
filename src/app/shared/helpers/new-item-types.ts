import { NewContentType } from 'src/app/modules/shared-components/components/add-content/add-content.component';
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
    title: $localize`Task`,
    description: $localize`A new task which users can try to solve.`,
  },
  {
    type: 'Course',
    icon: 'fa fa-book',
    title: $localize`Course`,
    description: $localize`A new course which users can view and learn.`,
  },
];

export const skillNewType: NewContentType<ItemType> = {
  type: 'Skill',
  icon: 'fa fa-graduation-cap',
  title: $localize`Skill`,
  description: $localize`A new sub-skill.`,
};

export function getAllowedNewItemTypes(allowSkills: boolean): NewContentType<ItemType>[] {
  return allowSkills ? [ skillNewType ].concat(allowedNewActivityTypes) : allowedNewActivityTypes;
}
