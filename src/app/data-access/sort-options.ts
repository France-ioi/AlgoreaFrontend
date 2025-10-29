import { HttpParams } from '@angular/common/http';
import { SortEvent } from 'src/app/ui-components/table-sort/table-sort-header/table-sort-header.component';

export interface SortOption {
  field: string,
  ascending: boolean,
}
export type SortOptions = readonly SortOption[];

export const NO_SORT: SortOptions = [];

export function multisortEventToOptions(events: SortEvent[]): SortOptions {
  return events.map(meta => ({ field: meta.field, ascending: meta.order >= 0 }));
}

export function sortEquals(sort1: SortOptions, sort2: SortOptions): boolean {
  return JSON.stringify(sort1) === JSON.stringify(sort2);
}

export function sortOptionsToHTTP(opts: SortOptions): HttpParams {
  let params = new HttpParams();
  if (opts.length == 0) return params;
  const apiFormatOpts = opts.map(opt => (opt.ascending ? opt.field : `-${opt.field}`));
  params = params.set('sort', apiFormatOpts.join(','));
  return params;
}
