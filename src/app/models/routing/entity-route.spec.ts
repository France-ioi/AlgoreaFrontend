import { isSameOrDescendantOf } from './entity-route';

describe('isSameOrDescendantOf', () => {
  it('returns true for an exact match', () => {
    expect(isSameOrDescendantOf({ id: 'root', path: [] }, { id: 'root', path: [] })).toBeTrue();
    expect(isSameOrDescendantOf({ id: 'child', path: [ 'root' ] }, { id: 'child', path: [ 'root' ] })).toBeTrue();
  });

  it('returns true when route is a descendant', () => {
    expect(isSameOrDescendantOf({ id: 'root', path: [] }, { id: 'child', path: [ 'root' ] })).toBeTrue();
    expect(isSameOrDescendantOf(
      { id: 'chapter', path: [ 'root' ] },
      { id: 'task', path: [ 'root', 'chapter' ] },
    )).toBeTrue();
  });

  it('returns false when route is shallower than content', () => {
    expect(isSameOrDescendantOf({ id: 'child', path: [ 'root' ] }, { id: 'root', path: [] })).toBeFalse();
  });

  it('returns false for a sibling with a shared prefix but divergent segment', () => {
    expect(isSameOrDescendantOf(
      { id: 'a', path: [ 'root' ] },
      { id: 'b', path: [ 'root' ] },
    )).toBeFalse();
  });

  it('matches any route under a root content id when content.path is empty', () => {
    expect(isSameOrDescendantOf({ id: '3000', path: [] }, { id: '3001', path: [ '3000' ] })).toBeTrue();
  });

  it('returns false for an unrelated route with empty paths', () => {
    expect(isSameOrDescendantOf({ id: '3000', path: [] }, { id: '4702', path: [] })).toBeFalse();
  });
});
