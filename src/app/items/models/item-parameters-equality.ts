import { ItemParametersValue } from 'src/app/items/models/item-parameters';
import { nullableDatesEqual, nullableDurationMsEqual, shallowEqual } from 'src/app/utils/shallow-equal';

const ITEM_PARAMETERS_KEYS = [
  'url',
  'usesApi',
  'textId',
  'validationType',
  'noScore',
  'promptToJoinGroupByCode',
  'childrenLayout',
  'thumbnailUrl',
  'allowsMultipleAttempts',
  'requiresExplicitEntry',
  'durationEnabled',
  'duration',
  'enteringTimeMinEnabled',
  'enteringTimeMin',
  'enteringTimeMaxEnabled',
  'enteringTimeMax',
  'entryParticipantTypeIsTeam',
  'entryFrozenTeams',
  'entryMaxTeamSize',
  'entryMinAdmittedMembersRatio',
] as const satisfies readonly (keyof ItemParametersValue)[];

export function itemParametersValueEqual(a: ItemParametersValue, b: ItemParametersValue): boolean {
  return shallowEqual(a, b, ITEM_PARAMETERS_KEYS, {
    duration: nullableDurationMsEqual,
    enteringTimeMin: nullableDatesEqual,
    enteringTimeMax: nullableDatesEqual,
  });
}
