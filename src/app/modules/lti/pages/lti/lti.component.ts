import { Component } from '@angular/core';
import { switchMap } from 'rxjs/operators';
import { LTIService } from 'src/app/core/services/lti.service';
import { GetItemChildrenService } from 'src/app/modules/item/http-services/get-item-children.service';
import { GetResultsService } from 'src/app/modules/item/http-services/get-results.service';
import { rawItemRoute } from 'src/app/shared/routing/item-route';
import { ItemRouter } from 'src/app/shared/routing/item-router';

@Component({
  selector: 'alg-lti',
  templateUrl: './lti.component.html',
  styleUrls: [ './lti.component.scss' ],
})
export class LTIComponent {

  error?: 'no content id' | 'fetch error' | 'no result' | 'no child';

  constructor(
    private itemRouter: ItemRouter,
    private ltiService: LTIService,
    private getResultsService: GetResultsService,
    private getItemChildrenService: GetItemChildrenService,
  ) {
    const contentId = this.ltiService.contentId;
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
