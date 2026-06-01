import { buildDisplaySettingsBody, displaySettingsSchema } from './display-settings';

describe('displaySettingsSchema', () => {
  it('should apply backend defaults when keys are absent', () => {
    expect(displaySettingsSchema.parse({})).toEqual({
      childrenLayout: 'List',
      promptToJoinGroupByCode: false,
      thumbnailUrl: null,
      disableChildrenPrevNextNav: false,
    });
  });

  it('should strip unknown keys', () => {
    expect(displaySettingsSchema.parse({ customBackendKey: 'drop-me', childrenLayout: 'Grid' })).toEqual({
      childrenLayout: 'Grid',
      promptToJoinGroupByCode: false,
      thumbnailUrl: null,
      disableChildrenPrevNextNav: false,
    });
  });
});

describe('buildDisplaySettingsBody', () => {
  it('should convert keys to snake_case', () => {
    expect(buildDisplaySettingsBody(
      { childrenLayout: 'Grid' },
      { omitDefaults: false },
    )).toEqual({
      children_layout: 'Grid',
      prompt_to_join_group_by_code: false,
      thumbnail_url: null,
      disable_children_prev_next_nav: false,
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
      promptToJoinGroupByCode: true,
      childrenLayout: 'Grid',
    })).toEqual({
      prompt_to_join_group_by_code: true,
      children_layout: 'Grid',
    });
  });

  it('should keep a non-null thumbnail_url in the body', () => {
    expect(buildDisplaySettingsBody({
      thumbnailUrl: 'https://example.test/thumb.png',
    })).toEqual({
      thumbnail_url: 'https://example.test/thumb.png',
    });
  });

  it('should produce an empty body when reverting the only non-default setting to its default value', () => {
    const initial = {
      ...displaySettingsSchema.parse({}),
      promptToJoinGroupByCode: true,
    };

    // Backend replaces display_settings as a whole; clearing the sole override yields {}.
    expect(buildDisplaySettingsBody({
      ...initial,
      promptToJoinGroupByCode: false,
    })).toEqual({});
  });
});
