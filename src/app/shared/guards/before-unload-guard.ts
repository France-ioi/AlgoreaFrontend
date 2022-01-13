import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanDeactivate, RouterStateSnapshot } from '@angular/router';
import { Observable, of } from 'rxjs';

export interface BeforeUnloadComponent {
  /**
   * Whether this component has pending changes
   */
  beforeUnload(): Observable<boolean>,
}

@Injectable()
export class BeforeUnloadGuard implements CanDeactivate<BeforeUnloadComponent> {

  constructor() {}

  canDeactivate(
    component: BeforeUnloadComponent | null,
    _currentRoute: ActivatedRouteSnapshot,
    _currentState: RouterStateSnapshot,
    _nextState: RouterStateSnapshot
  ): Observable<boolean> {
    return component ? component.beforeUnload() : of(true);
  }

}
