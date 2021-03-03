import { NewContentType } from 'src/app/modules/shared-components/components/add-content/add-content.component';
import { ItemType } from './item-type';

const allowedNewItemTypes: NewContentType<ItemType>[] = [
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
    type: 'Skill',
    icon: 'fa fa-graduation-cap',
    title: $localize`Skill`,
    description: $localize`A new sub-skill.`,
  },
];

export function getAllowedNewItemTypes(allowSkills: boolean): NewContentType<ItemType>[] {
  return allowSkills ? allowedNewItemTypes : allowedNewItemTypes.slice(0, -1);
}
