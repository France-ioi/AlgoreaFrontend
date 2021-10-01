import { ProgressFormValue } from 'src/app/modules/shared-components/components/collapsible-section/progress-form/progress-form.component';
import { TypeFilter } from '../composition-filter/composition-filter.component';

function getTargetTypeString(targetType: TypeFilter): string {
  switch (targetType) {
    case 'Users':
      return $localize`The user`;
    case 'Groups':
      return $localize`The group`;
    case 'Teams':
      return $localize`The team`;
  }
}

export function generateCanViewValues(targetType: TypeFilter): ProgressFormValue<string>[]{
  const targetTypeString = getTargetTypeString(targetType);
  return [
    {
      value: 'none',
      label: $localize`Nothing`,
      comment: $localize`${targetTypeString} can\'t see the item`
    },
    {
      value: 'info',
      label: $localize`Info`,
      comment: $localize`${targetTypeString} can see the item title and description, but not its content`
    },
    {
      value: 'content',
      label: $localize`Content`,
      comment: $localize`${targetTypeString} can see the content of this item`
    },
    {
      value: 'content_with_descendants',
      label: $localize`Content and descendants`,
      comment: $localize`${targetTypeString} can also see the content of this items descendants (when possible for this group)`
    },
    {
      value: 'solution',
      label: $localize`Solution`,
      comment: $localize`${targetTypeString} can also see the solution of this items and its descendants (when possible for this group)`
    }
  ];
}

export function generateCanGrantViewValues(targetType: TypeFilter): ProgressFormValue<string>[]{
  const targetTypeString = getTargetTypeString(targetType);
  return [
    {
      value: 'none',
      label: $localize`Nothing`,
      comment: $localize`${targetTypeString} can\'t grant any access to this item`
    },
    {
      value: 'enter',
      label: $localize`Info & enter`,
      comment: $localize`${targetTypeString} can grant \'Can view: info\' and  \'Can enter\' access`
    },
    {
      value: 'content',
      label: $localize`Content`,
      comment: $localize`${targetTypeString} can also grant \'Can view: content\' access`
    },
    {
      value: 'content_with_descendants',
      label: $localize`Content and descendants`,
      comment: $localize`${targetTypeString} can also grant \'Can view: content and descendants\' access`
    },
    {
      value: 'solution',
      label: $localize`Solution`,
      comment: $localize`${targetTypeString} can also grant \'Can view: solution\' access`,
      disabled: true
    },
    {
      value: 'solution_with_grant',
      label: $localize`Solution and grant`,
      comment: $localize`${targetTypeString} can also grant \'Can grant view\' access`,
      disabled: true
    }
  ];
}


export function generateCanWatchValues(targetType: TypeFilter): ProgressFormValue<string>[]{
  const targetTypeString = getTargetTypeString(targetType);
  return [
    {
      value: 'none',
      label: $localize`Nothing`,
      comment: $localize`${targetTypeString} can\'t watch the activity of others on this item`
    },
    {
      value: 'result',
      label: $localize`Result`,
      comment:
        $localize`${targetTypeString} can view information about submissions and scores of others on this item, but not their answers`
    },
    {
      value: 'answer',
      label: $localize`Answer`,
      comment: $localize`${targetTypeString} can also look at other people\'s answers on this item`
    },
    {
      value: 'answer_with_grant',
      label: $localize`Answer and grant`,
      comment: $localize`${targetTypeString} can also grant \'Can watch\' access to others`
    }
  ];
}

export function generateCanEditValues(targetType: TypeFilter): ProgressFormValue<string>[]{
  const targetTypeString = getTargetTypeString(targetType);
  return [
    {
      value: 'none',
      label: $localize`Nothing`,
      comment: $localize`${targetTypeString} can\'t make any changes to this item`
    },
    {
      value: 'children',
      label: $localize`Children`,
      comment: $localize`${targetTypeString} can add children to this item and edit how permissions propagate to them`
    },
    {
      value: 'all',
      label: $localize`All`,
      comment: $localize`${targetTypeString} can also edit the content of the item itself, but may not delete it`
    },
    {
      value: 'all_with_grant',
      label: $localize`All and grant`,
      comment: $localize`${targetTypeString} can also give \'Can edit\' access to others`
    }
  ];
}
