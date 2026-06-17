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
