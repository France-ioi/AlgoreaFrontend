import { inject, Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { Observable, of } from 'rxjs';
import { PendingChangesService } from '../services/pending-changes-service';
import { ConfirmationModalService } from 'src/app/services/confirmation-modal.service';
import { map } from 'rxjs/operators';

export interface PendingChangesComponent {
  /**
   * Whether this component has pending changes
   */
  isDirty(): boolean,
}

@Injectable({
  providedIn: 'root'
})
export class PendingChangesGuard {
  private confirmationModalService = inject(ConfirmationModalService);
  private pendingChangesService = inject(PendingChangesService);

  canDeactivate(
    component: PendingChangesComponent | null,
    _currentRoute: ActivatedRouteSnapshot,
    _currentState: RouterStateSnapshot,
    _nextState: RouterStateSnapshot
  ): Observable<boolean> {
    // If a component is not defined in router, need to use the PendingChangesService as alternative approach
    const pendingChangesComponent = component || this.pendingChangesService.component;

    if (!pendingChangesComponent) {
      // The component may still be not set in some specific scenarios.
      // Example: The routing leads to a "detail" component but its parent decides not to show it (for instance because there is an error
      //   in the parent). In such a case, when we leave the page, the "detail" component is being deactivated while not existing.
      return of(true);
    }

    // ISSUE: In current implementation, when user does navigation between modules (ex. from item to group) - the "canDeactivate" method
    // calls twice, as result it opens two modals. For avoid it need to check is confirmation modal opened
    return pendingChangesComponent.isDirty() && !this.confirmationModalService.opened() ? this.confirmationModalService.open({
      title: $localize`Confirm Navigation`,
      message: $localize`This page has unsaved changes. Do you want to leave this page and lose its changes?`,
      messageIconStyleClass: 'ph-duotone ph-warning-circle alg-validation-error',
      acceptButtonCaption: 'Yes, leave page',
      acceptButtonStyleClass: 'danger',
      acceptButtonIcon: 'ph-bold ph-check',
      rejectButtonIcon: 'ph-bold ph-x',
    }).pipe(map(accepted => !!accepted)) : of(true);
  }

}
