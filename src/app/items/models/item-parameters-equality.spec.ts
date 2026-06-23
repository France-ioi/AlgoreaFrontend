import { Duration } from 'src/app/utils/duration';
import { itemParametersValueEqual } from './item-parameters-equality';
import { ItemParametersValue } from './item-parameters';

function buildParameters(overrides: Partial<ItemParametersValue> = {}): ItemParametersValue {
  return {
    url: '',
    usesApi: false,
    textId: '',
    validationType: 'None',
    noScore: false,
    promptToJoinGroupByCode: false,
    childrenLayout: 'List',
    thumbnailUrl: '',
    disableChildrenPrevNextNav: false,
    hideHeader: false,
    showPlatformInsteadOfScore: false,
    leftNavIcon: '',
    allowsMultipleAttempts: false,
    requiresExplicitEntry: false,
    durationEnabled: false,
    duration: null,
    enteringTimeMinEnabled: false,
    enteringTimeMin: null,
    enteringTimeMaxEnabled: false,
    enteringTimeMax: null,
    entryParticipantTypeIsTeam: false,
    entryFrozenTeams: false,
    entryMaxTeamSize: 0,
    entryMinAdmittedMembersRatio: 'None',
    ...overrides,
  };
}

describe('itemParametersValueEqual', () => {
  it('compares date fields by timestamp', () => {
    const a = buildParameters({ enteringTimeMin: new Date('2020-01-01T00:00:00Z') });
    const b = buildParameters({ enteringTimeMin: new Date('2020-01-01T00:00:00.000Z') });
    expect(itemParametersValueEqual(a, b)).toBeTrue();
  });

  it('compares duration fields by milliseconds', () => {
    const a = buildParameters({ duration: Duration.fromSeconds(60) });
    const b = buildParameters({ duration: Duration.fromSeconds(60) });
    expect(itemParametersValueEqual(a, b)).toBeTrue();
  });
});
