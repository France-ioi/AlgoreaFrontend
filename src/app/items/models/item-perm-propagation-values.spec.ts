import {
  generatePropagationsValuesWithValidation,
} from './item-perm-propagation-values';
import { ItemCorePerm } from './item-permissions';
import { ItemViewPerm } from './item-view-permission';
import { ItemGrantViewPerm } from './item-grant-view-permission';
import { ItemEditPerm } from './item-edit-permission';
import { ItemWatchPerm } from './item-watch-permission';
import { itemContentViewPermPropagationEnum } from './item-perm-propagation';

describe('generatePropagationsValuesWithValidation', () => {
  const giverPermissions: ItemCorePerm = {
    canView: ItemViewPerm.Content,
    canGrantView: ItemGrantViewPerm.Content,
    canEdit: ItemEditPerm.All,
    canWatch: ItemWatchPerm.Answer,
    isOwner: true,
  };

  const regularContentViewPropagationValues = [
    {
      value: itemContentViewPermPropagationEnum.none,
      label: 'None',
      comment: 'The user can\'t see the item.',
    },
    {
      value: itemContentViewPermPropagationEnum.as_info,
      label: 'Info',
      comment: 'The user can see the item title and description, but not its content. A "lock" is displayed next to its icon.',
    },
    {
      value: itemContentViewPermPropagationEnum.as_content,
      label: 'Content',
      comment: 'The group can see the content of this item',
    },
  ];

  it('uses regular labels and comments when requiresExplicitEntry is false', () => {
    const { contentViewPropagationValues } = generatePropagationsValuesWithValidation(
      giverPermissions,
      {},
      false,
    );

    expect(contentViewPropagationValues.map(({ value, label, comment }) => ({ value, label, comment })))
      .toEqual(regularContentViewPropagationValues);
  });

  it('defaults requiresExplicitEntry to false when omitted', () => {
    const { contentViewPropagationValues } = generatePropagationsValuesWithValidation(
      giverPermissions,
      {},
    );

    expect(contentViewPropagationValues.map(({ value, label, comment }) => ({ value, label, comment })))
      .toEqual(regularContentViewPropagationValues);
  });

  it('keeps None/Info/Content labels and uses explicit-entry comments when requiresExplicitEntry is true', () => {
    const { contentViewPropagationValues } = generatePropagationsValuesWithValidation(
      giverPermissions,
      {},
      true,
    );

    // eslint-disable-next-line max-len
    const asInfoComment = 'The user can see the item title and description. For manual-entry activities such as this one, it allows the user to start participation manually (the user may still need additional enter permissions).';

    expect(contentViewPropagationValues.map(({ value, label, comment }) => ({ value, label, comment }))).toEqual([
      {
        value: itemContentViewPermPropagationEnum.none,
        label: 'None',
        comment: 'The user can\'t see the item.',
      },
      {
        value: itemContentViewPermPropagationEnum.as_info,
        label: 'Info',
        comment: asInfoComment,
      },
      {
        value: itemContentViewPermPropagationEnum.as_content,
        label: 'Content',
        comment: 'The group can start the manual-entry activity without any additional conditions.',
      },
    ]);
  });

  it('still disables options and sets tooltips in the explicit-entry branch', () => {
    const restrictedGiver: ItemCorePerm = {
      ...giverPermissions,
      canGrantView: ItemGrantViewPerm.None,
    };

    const { contentViewPropagationValues } = generatePropagationsValuesWithValidation(
      restrictedGiver,
      { contentViewPropagation: itemContentViewPermPropagationEnum.none },
      true,
    );

    const asInfo = contentViewPropagationValues.find(v => v.value === itemContentViewPermPropagationEnum.as_info);
    const asContent = contentViewPropagationValues.find(v => v.value === itemContentViewPermPropagationEnum.as_content);

    expect(asInfo?.disabled).toBe(true);
    expect(asInfo?.tooltip).toEqual([
      'Insufficient permissions. You need Can grant view >= "Info & enter"',
    ]);
    expect(asContent?.disabled).toBe(true);
    expect(asContent?.tooltip).toEqual([
      'Insufficient permissions. You need Can grant view >= "Content"',
    ]);
  });
});
