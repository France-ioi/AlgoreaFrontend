import { createEffect } from '@ngrx/effects';
import { inject } from '@angular/core';
import { Actions, ofType } from '@ngrx/effects';
import { filter, tap } from 'rxjs';
import { fromCurrentContent } from './current-content/current-content.store';

/**
 * Pushes a virtual pageview to both GTM's dataLayer and a custom DOM event
 * so any analytics tool (PostHog, Matomo, GA4, …) can pick it up.
 */
export const trackContentPageViewEffect = createEffect(
  (actions$ = inject(Actions)) => actions$.pipe(
    ofType(fromCurrentContent.contentPageActions.changeContent),
    filter(({ title }) => title !== undefined),
    tap(({ title, breadcrumbs }) => {
      const detail = {
        page_title: title,
        page_path: window.location.pathname,
        content_breadcrumb: breadcrumbs?.map(b => b.title).join(' > ') ?? '',
      };

      const w = window as unknown as Record<string, unknown>;
      const dataLayer = (w['dataLayer'] ?? (w['dataLayer'] = [])) as Record<string, unknown>[];
      dataLayer.push({ event: 'virtual_pageview', ...detail });

      window.dispatchEvent(new CustomEvent('spa-pageview', { detail }));
    }),
  ),
  { functional: true, dispatch: false },
);
