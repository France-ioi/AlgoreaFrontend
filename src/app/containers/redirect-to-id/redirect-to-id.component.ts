import { Component, inject, OnDestroy } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { map } from 'rxjs';
import { APPCONFIG } from 'src/app/app.config';
import { itemRoute } from 'src/app/models/routing/item-route';
import { ItemRouter } from 'src/app/models/routing/item-router';
import { CurrentContentService } from '../../services/current-content.service';
import { LoadingComponent } from '../../ui-components/loading/loading.component';
import { NgIf } from '@angular/common';

@Component({
  selector: 'alg-redirect-to-id',
  templateUrl: './redirect-to-id.component.html',
  standalone: true,
  imports: [
    NgIf,
    RouterLink,
    LoadingComponent,
  ],
})
export class RedirectToIdComponent implements OnDestroy {
  private config = inject(APPCONFIG);

  notExisting = false;

  private path$ = this.activatedRoute.paramMap.pipe(
    map(params => {
      const path = params.get('path');
      if (path === null) throw new Error('unexpected: path should be defined');
      return path;
    }),
  );

  private subscription = this.path$.pipe(
    map(path => (this.config.redirects ? this.config.redirects[path] : undefined))
  ).subscribe(route => {
    if (route) this.itemRouter.navigateTo(itemRoute('activity', route.id, { path: route.path }));
    else this.notExisting = true;
  });

  constructor(
    private activatedRoute: ActivatedRoute,
    private itemRouter: ItemRouter,
    private currentContentService: CurrentContentService,
  ) {
    this.currentContentService.clear();
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
  }
}
