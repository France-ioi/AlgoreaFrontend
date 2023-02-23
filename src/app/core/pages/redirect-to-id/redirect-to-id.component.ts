import { Component, OnDestroy } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { map } from 'rxjs';
import { appConfig } from 'src/app/shared/helpers/config';
import { rawItemRoute } from 'src/app/shared/routing/item-route';
import { ItemRouter } from 'src/app/shared/routing/item-router';
import { CurrentContentService } from 'src/app/shared/services/current-content.service';
import { LayoutService } from 'src/app/shared/services/layout.service';

@Component({
  selector: 'alg-redirect-to-id',
  templateUrl: './redirect-to-id.component.html',
})
export class RedirectToIdComponent implements OnDestroy {

  notExisting = false;

  private path$ = this.activatedRoute.paramMap.pipe(
    map(params => {
      const path = params.get('path');
      if (path === null) throw new Error('unexpected: path should be defined');
      return path;
    }),
  );

  private subscription = this.path$.pipe(
    map(path => (appConfig.redirects ? appConfig.redirects[path] : undefined))
  ).subscribe(route => {
    if (route) this.itemRouter.navigateTo({ ...rawItemRoute('activity', route.id), path: route.path });
    else this.notExisting = true;
  });

  constructor(
    private activatedRoute: ActivatedRoute,
    private itemRouter: ItemRouter,
    private layoutService: LayoutService,
    private currentContentService: CurrentContentService,
  ) {
    this.layoutService.configure({ fullFrameActive: false });
    this.currentContentService.clear();
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
  }
}
