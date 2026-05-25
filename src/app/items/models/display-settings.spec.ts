import { buildDisplaySettingsBody, displaySettingsSchema } from './display-settings';

describe('displaySettingsSchema', () => {
  it('should apply backend defaults when keys are absent', () => {
    expect(displaySettingsSchema.parse({})).toEqual({
      titleBarVisible: true,
      displayDetailsInParent: false,
      fullScreen: 'default',
      fixedRanks: false,
      showUserInfos: false,
      childrenLayout: 'List',
      promptToJoinGroupByCode: false,
    });
  });

  it('should strip unknown keys', () => {
    expect(displaySettingsSchema.parse({ customBackendKey: 'drop-me', childrenLayout: 'Grid' })).toEqual({
      titleBarVisible: true,
      displayDetailsInParent: false,
      fullScreen: 'default',
      fixedRanks: false,
      showUserInfos: false,
      childrenLayout: 'Grid',
      promptToJoinGroupByCode: false,
    });
  });
});

describe('buildDisplaySettingsBody', () => {
  it('should convert keys to snake_case', () => {
    expect(buildDisplaySettingsBody(
      { childrenLayout: 'Grid' },
      { omitDefaults: false },
    )).toEqual({
      title_bar_visible: true,
      display_details_in_parent: false,
      full_screen: 'default',
      fixed_ranks: false,
      show_user_infos: false,
      children_layout: 'Grid',
      prompt_to_join_group_by_code: false,
    });
  });

  it('should omit keys equal to defaults when omitDefaults is true', () => {
    expect(buildDisplaySettingsBody({
      childrenLayout: 'List',
      promptToJoinGroupByCode: false,
    })).toEqual({});
  });

  it('should keep non-default values', () => {
    expect(buildDisplaySettingsBody({
      childrenLayout: 'Grid',
      promptToJoinGroupByCode: true,
    })).toEqual({
      children_layout: 'Grid',
      prompt_to_join_group_by_code: true,
    });
  });

  it('should preserve unedited non-default settings from the initial item', () => {
    expect(buildDisplaySettingsBody({
      ...displaySettingsSchema.parse({}),
      fixedRanks: true,
      childrenLayout: 'Grid',
    })).toEqual({
      fixed_ranks: true,
      children_layout: 'Grid',
    });
  });

  it('should produce an empty body when reverting the only non-default setting to its default value', () => {
    const initial = {
      ...displaySettingsSchema.parse({}),
      titleBarVisible: false,
    };

    // Backend replaces display_settings as a whole; clearing the sole override yields {}.
    expect(buildDisplaySettingsBody({
      ...initial,
      titleBarVisible: true,
    })).toEqual({});
  });
});
