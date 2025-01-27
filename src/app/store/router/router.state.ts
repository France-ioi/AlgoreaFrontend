import { Params, UrlSegment } from '@angular/router';

export interface State {
  url: string,
  params: Params,
  queryParams: Params,
  segments: UrlSegment[],
}
