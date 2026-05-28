import { StringsValue } from 'src/app/items/containers/item-strings-form-group/item-strings-control/item-strings-control.component';
import { buildItemAllStringsChanges, buildItemStringChanges, collectStringsToRemove } from './item-strings-changes';

function makeStrings(overrides: Partial<StringsValue> = {}): StringsValue {
  return {
    languageTag: 'en',
    title: 'Title',
    subtitle: '',
    description: '',
    ...overrides,
  };
}

describe('buildItemStringChanges', () => {
  it('returns no changes when the value matches the initial value', () => {
    const value = makeStrings();
    const { changes } = buildItemStringChanges(value, { initialValue: value });
    expect(changes).toEqual({});
  });

  it('trims whitespace from the title', () => {
    const initial = makeStrings({ title: 'Old' });
    const current = makeStrings({ title: '  New title  ' });
    expect(buildItemStringChanges(current, { initialValue: initial }).changes).toEqual({ title: 'New title' });
  });

  it('never touches image_url', () => {
    const value = makeStrings();
    expect('image_url' in buildItemStringChanges(value, { initialValue: value }).changes).toBe(false);
  });
});

describe('buildItemAllStringsChanges', () => {
  it('returns no changes when strings are unchanged', () => {
    const initial = makeStrings();
    const result = buildItemAllStringsChanges([ initial ], [ initial ]);
    expect(result).toEqual([]);
  });

  it('includes pending-deletion server languages even when never loaded into the initial snapshot', () => {
    const en = makeStrings({ languageTag: 'en' });
    const outbound = [ en ];
    const pendingDeletions = new Set([ 'fr' ]);
    const result = collectStringsToRemove(outbound, [ en ], pendingDeletions, [ 'en', 'fr' ]);
    expect(result).toEqual([ 'fr' ]);
  });

  it('does not delete a language that was only added locally and marked pending-deletion', () => {
    const en = makeStrings({ languageTag: 'en' });
    const outbound = [ en ];
    const pendingDeletions = new Set([ 'fr' ]);
    const result = collectStringsToRemove(outbound, [ en ], pendingDeletions, [ 'en' ]);
    expect(result).toEqual([]);
  });
});
