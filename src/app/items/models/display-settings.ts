import { z } from 'zod';
import { camelToSnakeKeys, SnakeCaseKeys } from 'src/app/utils/case_conversion';
import { itemChildrenLayoutSchema, itemFullScreenSchema } from './item-properties';

export const displaySettingsSchema = z.object({
  titleBarVisible: z.boolean().default(true),
  displayDetailsInParent: z.boolean().default(false),
  fullScreen: itemFullScreenSchema.default('default'),
  fixedRanks: z.boolean().default(false),
  showUserInfos: z.boolean().default(false),
  childrenLayout: itemChildrenLayoutSchema.default('List'),
  promptToJoinGroupByCode: z.boolean().default(false),
});

export type DisplaySettings = z.output<typeof displaySettingsSchema>;

/** Snake_case PUT payload for `display_settings`; partial because non-default keys only are sent. */
export type DisplaySettingsChanges = Partial<SnakeCaseKeys<DisplaySettings>>;

const DEFAULT_SNAKE_DISPLAY_SETTINGS = camelToSnakeKeys(displaySettingsSchema.parse({}));

/**
 * Build the `display_settings` PUT payload from camelCase item settings.
 * Validates against `displaySettingsSchema`, converts keys to snake_case, and by default
 * omits keys equal to schema defaults so the backend stores only non-default values.
 * Assumes the backend replaces `display_settings` as a whole (not merge/PATCH); an empty
 * object after omitting defaults is intentional when the user clears all stored overrides.
 */
export function buildDisplaySettingsBody(
  settingsCamel: z.input<typeof displaySettingsSchema>,
  options: { omitDefaults?: boolean } = {},
): DisplaySettingsChanges {
  const parsed = displaySettingsSchema.parse(settingsCamel);
  const snake = camelToSnakeKeys(parsed);
  const omitDefaults = options.omitDefaults ?? true;

  if (!omitDefaults) {
    return snake;
  }

  const result: Record<string, unknown> = {};
  for (const [ key, value ] of Object.entries(snake)) {
    if (key in DEFAULT_SNAKE_DISPLAY_SETTINGS
      && DEFAULT_SNAKE_DISPLAY_SETTINGS[key as keyof DisplaySettingsChanges] === value) {
      continue;
    }
    result[key] = value;
  }
  return result;
}
