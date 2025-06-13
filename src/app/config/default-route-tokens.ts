import { inject, InjectionToken } from '@angular/core';
import { APPCONFIG } from '.'; // Adjusted path
import { FullItemRoute, itemRoute } from '../models/routing/item-route';
import { defaultAttemptId } from '../items/models/attempts'; // Adjusted path

export const DEFAULT_ACTIVITY_ROUTE = new InjectionToken('app.defaultActivityRoute', {
  providedIn: 'root',
  factory: (): FullItemRoute => {
    const config = inject(APPCONFIG);
    return itemRoute('activity', config.defaultActivityId, { path: [], parentAttemptId: defaultAttemptId });
  }
});
export const DEFAULT_SKILL_ROUTE = new InjectionToken('app.defaultSkillRoute', {
  providedIn: 'root',
  factory: (): FullItemRoute|undefined => {
    const config = inject(APPCONFIG);
    return config.defaultSkillId ? itemRoute('skill', config.defaultSkillId, { path: [], parentAttemptId: defaultAttemptId }) : undefined;
  }
});
