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

type DisplaySettings = z.output<typeof displaySettingsSchema>;
type DisplaySettingsInput = z.input<typeof displaySettingsSchema>;

/** Snake_case PUT payload for `display_settings`; partial because non-default keys only are sent. */
export type DisplaySettingsChanges = Partial<SnakeCaseKeys<DisplaySettings>>;

/**
 * Build the `display_settings` PUT payload from camelCase item settings.
 * Validates against `displaySettingsSchema`, converts keys to snake_case, and by default
 * omits keys equal to schema defaults so the backend stores only non-default values.
 */
export function buildDisplaySettingsBody(
  settingsCamel: DisplaySettingsInput,
  options: { omitDefaults: boolean } = { omitDefaults: true },
): DisplaySettingsChanges {
  const parsed = displaySettingsSchema.parse(settingsCamel);
  const snake = camelToSnakeKeys(parsed);

  if (!options.omitDefaults) {
    return snake;
  }

  const defaultSnake = camelToSnakeKeys(displaySettingsSchema.parse({}));
  const result: Record<string, unknown> = {};
  for (const [ key, value ] of Object.entries(snake)) {
    if (key in defaultSnake && defaultSnake[key as keyof DisplaySettingsChanges] === value) {
      continue;
    }
    result[key] = value;
  }
  return result;
}
