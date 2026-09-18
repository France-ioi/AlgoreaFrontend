import { NewContentType } from 'src/app/ui-components/add-content/add-content.component';
import { ActivityType, ItemType } from './item-type';
import { resolveLeftNavIconForType } from './left-nav-icons';

export const allowedNewActivityTypes: NewContentType<ActivityType>[] = [
  {
    type: 'Chapter',
    // Duotone weight matches other create-type cards; glyph matches left-nav defaults.
    icon: `ph-duotone ${resolveLeftNavIconForType('chapter')}`,
    title: $localize`Chapter`,
    description: $localize`A new folder which can contain any activities.`,
  },
  {
    type: 'Task',
    icon: `ph-duotone ${resolveLeftNavIconForType('task')}`,
    title: $localize`Task`,
    allowToAddUrl: true,
  },
];

export const skillNewType: NewContentType<ItemType> = {
  type: 'Skill',
  icon: 'ph-duotone ph-graduation-cap',
  title: $localize`Skill`,
  description: $localize`A new skill.`,
};

export function getAllowedNewItemTypes(options: {allowActivities?: boolean, allowSkills?: boolean}): NewContentType<ItemType>[] {
  return [
    ...(options.allowSkills ? [ skillNewType ] : []),
    ...(options.allowActivities ? allowedNewActivityTypes : []),
  ];
}
