import { Params } from '@angular/router';

export interface State {
  url: string,
  path: string[],
  params: Params,
  queryParams: Params,
}
