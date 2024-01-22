import { RouterStateSnapshot } from '@angular/router';
import { RouterStateSerializer } from '@ngrx/router-store';
import { State } from './router.state';

/**
 * Custom serializer to prevent the state to store the full router state (for nothing)
 */
export class RouterSerializer implements RouterStateSerializer<State> {
  serialize(routerState: RouterStateSnapshot): State {
    const {
      url,
      root: { queryParams },
    } = routerState;
    return { url, queryParams };
  }
}
