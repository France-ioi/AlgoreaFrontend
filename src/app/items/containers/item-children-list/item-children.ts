import { DisplaySettings } from 'src/app/items/models/display-settings';
import { ItemChildCategory } from 'src/app/items/models/item-properties';
import { ItemType } from 'src/app/items/models/item-type';

export interface ItemChildWithAdditions {
  id: string,
  string: {
    title: string | null,
    subtitle?: string | null,
    /** Present on L1 when include_description was requested and can_view >= content; null = empty. */
    description?: string | null,
  },
  displaySettings: DisplaySettings,
  category: ItemChildCategory,
  type: ItemType,
  watchedGroup?: {
    allValidated?: boolean,
    avgScore?: number,
  },
  bestScore: number,
  isLocked: boolean,
  /** From children API when present; absent/false means implicit start is allowed. */
  requiresExplicitEntry?: boolean,
  result?: {
    attemptId: string,
    validated: boolean,
    score: number,
  },
  noScore?: boolean,
  /** Present only for L1 children when TwoLevels layout fetches nested children; absent = not eligible. */
  children?: ItemChildWithAdditions[],
}
