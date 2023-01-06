import { ItemChild } from '../http-services/get-item-children.service';

export interface ItemChildWithAdditions extends ItemChild {
  isLocked: boolean,
  result?: {
    attemptId: string,
    validated: boolean,
    score: number,
  },
}
