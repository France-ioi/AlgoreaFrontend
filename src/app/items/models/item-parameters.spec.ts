import { Duration } from 'src/app/utils/duration';
import {
  buildItemParametersChanges,
  DEFAULT_ENTERING_TIME_MAX,
  DEFAULT_ENTERING_TIME_MIN,
  ItemParametersValue,
  sectionsForItemType,
} from './item-parameters';

const initialDisplaySettings = {
  childrenLayout: 'List' as const,
  promptToJoinGroupByCode: false,
  thumbnailUrl: null,
  disableChildrenPrevNextNav: false,
  leftNavIcon: null,
};

function makeValue(overrides: Partial<ItemParametersValue> = {}): ItemParametersValue {
  return {
    url: '',
    usesApi: false,
    textId: '',
    validationType: 'All',
    noScore: false,
    promptToJoinGroupByCode: false,
    childrenLayout: 'List',
    thumbnailUrl: '',
    disableChildrenPrevNextNav: false,
    leftNavIcon: '',
    allowsMultipleAttempts: false,
    requiresExplicitEntry: false,
    durationEnabled: false,
    duration: null,
    enteringTimeMinEnabled: false,
    enteringTimeMin: new Date(DEFAULT_ENTERING_TIME_MIN),
    enteringTimeMaxEnabled: false,
    enteringTimeMax: new Date(DEFAULT_ENTERING_TIME_MAX),
    entryParticipantTypeIsTeam: false,
    entryFrozenTeams: false,
    entryMaxTeamSize: 0,
    entryMinAdmittedMembersRatio: 'None',
    ...overrides,
  };
}

describe('sectionsForItemType', () => {
  it('exposes global only for Tasks', () => {
    expect(sectionsForItemType('Task').global).toBe(true);
    expect(sectionsForItemType('Chapter').global).toBe(false);
    expect(sectionsForItemType('Skill').global).toBe(false);
  });

  it('exposes score for Chapter and Skill only', () => {
    expect(sectionsForItemType('Task').score).toBe(false);
    expect(sectionsForItemType('Chapter').score).toBe(true);
    expect(sectionsForItemType('Skill').score).toBe(true);
  });

  it('hides display/participation/team for Skill', () => {
    const s = sectionsForItemType('Skill');
    expect(s.display.enabled).toBe(false);
    expect(s.participation).toBe(false);
    expect(s.team).toBe(false);
  });

  it('shows display/participation/team for Task and Chapter', () => {
    for (const t of [ 'Task', 'Chapter' ] as const) {
      const s = sectionsForItemType(t);
      expect(s.display.enabled).toBe(true);
      expect(s.participation).toBe(true);
      expect(s.team).toBe(true);
    }
  });

  it('exposes the display sub-options per item type', () => {
    expect(sectionsForItemType('Task').display).toEqual({
      enabled: true,
      showChildrenLayout: false,
      showThumbnailUrl: true,
      showDisableChildrenPrevNextNav: false,
      showLeftNavIcon: true,
    });
    expect(sectionsForItemType('Chapter').display).toEqual({
      enabled: true,
      showChildrenLayout: true,
      showThumbnailUrl: true,
      showDisableChildrenPrevNextNav: true,
      showLeftNavIcon: true,
    });
    expect(sectionsForItemType('Skill').display).toEqual({
      enabled: false,
      showChildrenLayout: true,
      showThumbnailUrl: false,
      showDisableChildrenPrevNextNav: false,
      showLeftNavIcon: false,
    });
  });
});

describe('buildItemParametersChanges', () => {
  it('returns an empty object when no value changed', () => {
    const value = makeValue();
    expect(buildItemParametersChanges(value, value, sectionsForItemType('Task'), initialDisplaySettings)).toEqual({});
  });

  it('maps url empty string to null', () => {
    const initial = makeValue({ url: 'https://example.test' });
    const current = makeValue({ url: '' });
    expect(buildItemParametersChanges(current, initial, sectionsForItemType('Task'), initialDisplaySettings))
      .toEqual({ url: null });
  });

  it('trims url and treats whitespace-only as null', () => {
    const initial = makeValue({ url: 'https://example.test' });
    const current = makeValue({ url: '   ' });
    expect(buildItemParametersChanges(current, initial, sectionsForItemType('Task'), initialDisplaySettings))
      .toEqual({ url: null });
  });

  it('treats a whitespace-only edit to a previously-null url as a no-op', () => {
    const initial = makeValue({ url: '' });
    const current = makeValue({ url: '   ' });
    expect(buildItemParametersChanges(current, initial, sectionsForItemType('Task'), initialDisplaySettings))
      .toEqual({});
  });

  it('trims text_id and treats whitespace-only as null', () => {
    const initial = makeValue({ textId: 'old' });
    const current = makeValue({ textId: '   ' });
    expect(buildItemParametersChanges(current, initial, sectionsForItemType('Task'), initialDisplaySettings))
      .toEqual({ text_id: null });
  });

  it('emits display_settings only when at least one display field changed', () => {
    const initial = makeValue();
    const current = makeValue({ promptToJoinGroupByCode: true });
    const changes = buildItemParametersChanges(current, initial, sectionsForItemType('Chapter'), initialDisplaySettings);
    expect(changes.display_settings).toEqual({ prompt_to_join_group_by_code: true });
  });

  it('emits display_settings.thumbnail_url when the thumbnail changes', () => {
    const initial = makeValue();
    const current = makeValue({ thumbnailUrl: 'https://example.test/thumb.png' });
    const changes = buildItemParametersChanges(current, initial, sectionsForItemType('Chapter'), initialDisplaySettings);
    expect(changes.display_settings).toEqual({ thumbnail_url: 'https://example.test/thumb.png' });
  });

  it('omits thumbnail_url from the body when the user clears it (null is the schema default)', () => {
    const initial = makeValue({ thumbnailUrl: 'https://example.test/thumb.png' });
    const current = makeValue({ thumbnailUrl: '' });
    const changes = buildItemParametersChanges(
      current,
      initial,
      sectionsForItemType('Chapter'),
      { ...initialDisplaySettings, thumbnailUrl: 'https://example.test/thumb.png' },
    );
    // Backend replaces display_settings as a whole; an empty body clears the stored thumbnail override.
    expect(changes.display_settings).toEqual({});
  });

  it('emits display_settings.left_nav_icon when the sidebar icon changes', () => {
    const initial = makeValue();
    const current = makeValue({ leftNavIcon: 'puzzle-piece' });
    const changes = buildItemParametersChanges(current, initial, sectionsForItemType('Task'), initialDisplaySettings);
    expect(changes.display_settings).toEqual({ left_nav_icon: 'puzzle-piece' });
  });

  it('omits left_nav_icon from the body when the user clears a custom icon (null is the schema default)', () => {
    const initial = makeValue({ leftNavIcon: 'puzzle-piece' });
    const current = makeValue({ leftNavIcon: '' });
    const changes = buildItemParametersChanges(
      current,
      initial,
      sectionsForItemType('Task'),
      { ...initialDisplaySettings, leftNavIcon: 'puzzle-piece' },
    );
    expect(changes.display_settings).toEqual({});
  });

  it('emits disable_children_prev_next_nav when the chapter-only toggle changed', () => {
    const initial = makeValue();
    const current = makeValue({ disableChildrenPrevNextNav: true });
    const changes = buildItemParametersChanges(current, initial, sectionsForItemType('Chapter'), initialDisplaySettings);
    expect(changes.display_settings).toEqual({ disable_children_prev_next_nav: true });
  });

  it('does not emit display_settings when display values are unchanged', () => {
    const initial = makeValue({ validationType: 'All' });
    const current = makeValue({ validationType: 'None' });
    const changes = buildItemParametersChanges(current, initial, sectionsForItemType('Chapter'), initialDisplaySettings);
    expect(changes.display_settings).toBeUndefined();
    expect(changes.validation_type).toEqual('None');
  });

  it('clears duration when participation is required but duration is disabled', () => {
    const initial = makeValue({
      requiresExplicitEntry: true,
      durationEnabled: true,
      duration: Duration.fromHMS(1, 0, 0),
    });
    const current = makeValue({
      requiresExplicitEntry: true,
      durationEnabled: false,
      duration: Duration.fromHMS(1, 0, 0),
    });
    const changes = buildItemParametersChanges(current, initial, sectionsForItemType('Chapter'), initialDisplaySettings);
    expect(changes.duration).toBeNull();
  });

  it('serializes duration when participation and duration are both enabled', () => {
    const initial = makeValue();
    const current = makeValue({
      requiresExplicitEntry: true,
      durationEnabled: true,
      duration: Duration.fromHMS(2, 30, 0),
    });
    const changes = buildItemParametersChanges(current, initial, sectionsForItemType('Chapter'), initialDisplaySettings);
    expect(changes.duration).toEqual('2:30:0');
    expect(changes.requires_explicit_entry).toBe(true);
  });

  it('sends sentinel entering_time_min when the toggle is cleared', () => {
    const customMin = new Date('2025-01-01T00:00:00Z');
    const initial = makeValue({ enteringTimeMinEnabled: true, enteringTimeMin: customMin });
    const current = makeValue({ enteringTimeMinEnabled: false, enteringTimeMin: customMin });
    const changes = buildItemParametersChanges(current, initial, sectionsForItemType('Chapter'), initialDisplaySettings);
    expect(changes.entering_time_min).toEqual(new Date(DEFAULT_ENTERING_TIME_MIN));
  });

  it('encodes the team participant type toggle as the snake_case string', () => {
    const initial = makeValue();
    const current = makeValue({ entryParticipantTypeIsTeam: true });
    const changes = buildItemParametersChanges(current, initial, sectionsForItemType('Chapter'), initialDisplaySettings);
    expect(changes.entry_participant_type).toEqual('Team');
  });

  it('skips participation and team for Skill items', () => {
    const initial = makeValue();
    const current = makeValue({
      requiresExplicitEntry: true,
      entryParticipantTypeIsTeam: true,
      entryMaxTeamSize: 5,
    });
    const changes = buildItemParametersChanges(current, initial, sectionsForItemType('Skill'), initialDisplaySettings);
    expect(changes.requires_explicit_entry).toBeUndefined();
    expect(changes.entry_participant_type).toBeUndefined();
    expect(changes.entry_max_team_size).toBeUndefined();
  });
});
