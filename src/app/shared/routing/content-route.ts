
/* for url */
export const pathParamName = 'path';

type Id = string;

export interface ContentRoute {
  contentType: string;
  id: Id;
  path: Id[];
}
