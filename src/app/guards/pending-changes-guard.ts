import { Injectable, OnDestroy } from '@angular/core';
import { ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { ConfirmationService } from 'primeng/api';
import { Observable, of, Subject } from 'rxjs';
import { PendingChangesService } from '../services/pending-changes-service';

export interface PendingChangesComponent {
  /**
   * Whether this component has pending changes
   */
  isDirty(): boolean,
}

@Injectable({
  providedIn: 'root'
})
export class PendingChangesGuard implements OnDestroy {

  private dialogResponse = new Subject<boolean>();

  constructor(
    private confirmationService: ConfirmationService,
    private pendingChangesService: PendingChangesService,
  ) {}

  ngOnDestroy(): void {
    this.dialogResponse.complete();
  }

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

    if (!pendingChangesComponent.isDirty()) return of(true);
    this.confirmationService.confirm({
      message: $localize`This page has unsaved changes. Do you want to leave this page and lose its changes?`,
      header: $localize`Confirm Navigation`,
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: $localize`Yes, leave page`,
      accept: () => {
        this.dialogResponse.next(true);
      },
      rejectLabel: $localize`No`,
      reject: () => {
        this.dialogResponse.next(false);
      },
    });

    return this.dialogResponse;
  }

}
