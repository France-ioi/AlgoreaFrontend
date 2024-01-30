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

    // extract all params in the router state
    let params = {};
    let route = routerState.root;
    while (route.firstChild) {
      route = route.firstChild;
      params = { ...params, ...route.params };
    }

    // extract path segments as string[]
    const path = route.pathFromRoot.flatMap(({ url }) => url).map(({ path }) => path);

    return { url, path, params, queryParams };
  }
}
