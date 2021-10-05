
export interface NavMenuItem {
  id: string,
  title: string, // not null to implement NavTreeElement
  hasChildren: boolean,
  groupName?: string,
  attemptId: string|null,
  bestScore?: number,
  currentScore?: number,
  validated?: boolean,
  children?: NavMenuItem[], // placeholder for children when fetched (may 'hasChildren' with 'children' not set)
  locked: boolean,
}
