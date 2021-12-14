import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { switchMap } from 'rxjs/operators';
import { GetItemChildrenService } from 'src/app/modules/item/http-services/get-item-children.service';
import { GetResultsService } from 'src/app/modules/item/http-services/get-results.service';
import { rawItemRoute } from 'src/app/shared/routing/item-route';
import { ItemRouter } from 'src/app/shared/routing/item-router';
import { LayoutService } from 'src/app/shared/services/layout.service';

@Component({
  selector: 'alg-lti',
  templateUrl: './lti.component.html',
  styleUrls: [ './lti.component.scss' ],
})
export class LTIComponent {

  error?: 'no content id' | 'fetch error' | 'no result' | 'no child';

  constructor(
    private activatedRoute: ActivatedRoute,
    private itemRouter: ItemRouter,
    private getResultsService: GetResultsService,
    private getItemChildrenService: GetItemChildrenService,
    private layoutService: LayoutService,
  ) {
    this.layoutService.toggleTopRightControls(false);
    this.layoutService.toggleFullFrameContent(true, false);

    const contentId = this.activatedRoute.snapshot.paramMap.get('contentId');
    if (!contentId) {
      this.error = 'no content id';
      return;
    }

    const noResultError = new Error('no result');
    this.getResultsService.get(contentId, { attempt_id: '0', limit: 1, sort: [ '-id' ] }).pipe(
      switchMap(([ result ]) => {
        if (!result) throw noResultError;
        return this.getItemChildrenService.get(contentId, result.attemptId);
      })
    ).subscribe({
      next: ([ firstChild ]) => {
        if (firstChild) this.itemRouter.navigateTo(rawItemRoute('activity', firstChild.id), { navExtras: { replaceUrl: true } });
        else this.error = 'no child';
      },
      error: error => this.error = error === noResultError ? 'no result' : 'fetch error',
    });
  }

}
