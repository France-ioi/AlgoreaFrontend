import { ProgressSectionValue } from 'src/app/modules/shared-components/components/progress-section/progress-section.component';

export function generateCanViewValues(targetTypeString: string): ProgressSectionValue<string>[]{
  return [
    {
      value: 'none',
      label: 'Nothing',
      comment: 'The ' + targetTypeString + ' can\'t see the item'
    },
    {
      value: 'info',
      label: 'Info',
      comment: 'The ' + targetTypeString + ' can see the item title and description, but not its content'
    },
    {
      value: 'content',
      label: 'Content',
      comment: 'The ' + targetTypeString + ' can see the content of this item'
    },
    {
      value: 'content_with_descendants',
      label: 'Content and descendants',
      comment: 'The ' + targetTypeString + ' can also see the content of this items descendants (when possible for this group)'
    },
    {
      value: 'solution',
      label: 'Solution',
      comment: 'The ' + targetTypeString + ' can also see the solution of this items and its descendants (when possible for this group)'
    }
  ];
}

export function generateCanGrantViewValues(targetTypeString: string): ProgressSectionValue<string>[]{
  return [
    {
      value: 'none',
      label: 'Nothing',
      comment: 'The ' + targetTypeString + ' can\'t grant any access to this item'
    },
    {
      value: 'enter',
      label: 'Info & enter',
      comment: 'The ' + targetTypeString + ' can grant \'Can view: info\' and  \'Can enter\' access'
    },
    {
      value: 'content',
      label: 'Content',
      comment: 'The ' + targetTypeString + ' can also grant \'Can view: content\' access'
    },
    {
      value: 'content_with_descendants',
      label: 'Content and descendants',
      comment: 'The ' + targetTypeString + ' can also grant \'Can view: content and descendants\' access'
    },
    {
      value: 'solution',
      label: 'Solution',
      comment: 'The ' + targetTypeString + ' can also grant \'Can view: solution\' access',
      disabled: true
    },
    {
      value: 'solution_with_grant',
      label: 'Solution and grant',
      comment: 'The ' + targetTypeString + ' can also grant \'Can grant view\' access',
      disabled: true
    }
  ];
}


export function generateCanWatchValues(targetTypeString: string): ProgressSectionValue<string>[]{
  return [
    {
      value: 'none',
      label: 'Nothing',
      comment: 'The ' + targetTypeString + ' can\'t watch the activity of others on this item'
    },
    {
      value: 'result',
      label: 'Result',
      comment: 'The ' +targetTypeString + ' can view information about submissions and scores of others on this item, but not their answers'
    },
    {
      value: 'answer',
      label: 'Answer',
      comment: 'The ' + targetTypeString + ' can also look at other people\'s answers on this item'
    },
    {
      value: 'answer_with_grant',
      label: 'Answer and grant',
      comment: 'The ' + targetTypeString + ' can also grant \'Can watch\' access to others'
    }
  ];
}

export function generateCanEditValues(targetTypeString: string): ProgressSectionValue<string>[]{
  return [
    {
      value: 'none',
      label: 'Nothing',
      comment: 'The ' + targetTypeString + ' can\'t make any changes to this item'
    },
    {
      value: 'children',
      label: 'Children',
      comment: 'The ' + targetTypeString + ' can add children to this item and edit how permissions propagate to them'
    },
    {
      value: 'all',
      label: 'All',
      comment: 'The ' + targetTypeString + ' can also edit the content of the item itself, but may not delete it'
    },
    {
      value: 'all_with_grant',
      label: 'All and grant',
      comment: 'The ' + targetTypeString + ' can also give \'Can edit\' access to others'
    }
  ];
}
