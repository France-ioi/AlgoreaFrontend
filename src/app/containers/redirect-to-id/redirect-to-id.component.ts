import { Component, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { map } from 'rxjs';
import { APPCONFIG } from 'src/app/config';
import { itemRoute } from 'src/app/models/routing/item-route';
import { ItemRouter } from 'src/app/models/routing/item-router';
import { CurrentContentService } from '../../services/current-content.service';
import { LoadingComponent } from '../../ui-components/loading/loading.component';


@Component({
  selector: 'alg-redirect-to-id',
  templateUrl: './redirect-to-id.component.html',
  imports: [
    RouterLink,
    LoadingComponent,
  ]
})
export class RedirectToIdComponent {
  private activatedRoute = inject(ActivatedRoute);
  private itemRouter = inject(ItemRouter);
  private currentContentService = inject(CurrentContentService);
  private config = inject(APPCONFIG);

  notExisting = signal(false);

  private path$ = this.activatedRoute.paramMap.pipe(
    map(params => {
      const path = params.get('path');
      if (path === null) throw new Error('unexpected: path should be defined');
      return path;
    }),
  );

  constructor() {
    // Clear before subscribing so a synchronous paramMap emit/navigate cannot race with clearing.
    this.currentContentService.clear();

    this.path$.pipe(
      map(path => this.config.redirects[path]),
      takeUntilDestroyed(),
    ).subscribe(route => {
      if (route) this.itemRouter.navigateTo(itemRoute('activity', route.id, { path: route.path }), { useCurrentObservation: true });
      else this.notExisting.set(true);
    });
  }
}
