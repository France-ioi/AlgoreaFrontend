import { appConfig } from 'src/app/utils/config';
import { itemRoute } from './item-route';
import { defaultAttemptId } from 'src/app/items/models/attempts';

/**
 * The route to the app default (see config) item
 */
export const appDefaultActivityRoute = itemRoute('activity', appConfig.defaultActivityId, { path: [], parentAttemptId: defaultAttemptId });

/**
 * The route to the app default skill (from config)
 */
export const appDefaultSkillRoute = appConfig.defaultSkillId ?
  itemRoute('skill', appConfig.defaultSkillId, { path: [], parentAttemptId: defaultAttemptId }) :
  undefined;
