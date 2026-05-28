import { Item } from 'src/app/data-access/get-item-by-id.service';
import { StringsValue } from 'src/app/items/containers/item-strings-form-group/item-strings-control/item-strings-control.component';
import { buildItemAllStringsChanges, buildItemStringChanges, collectStringsToRemove } from './item-strings-changes';

function makeStrings(overrides: Partial<StringsValue> = {}): StringsValue {
  return {
    languageTag: 'en',
    title: 'Title',
    subtitle: '',
    description: '',
    imageUrl: '',
    ...overrides,
  };
}

function makeItem(stringOverrides: Partial<Item['string']> = {}): Pick<Item, 'string'> {
  return {
    string: {
      languageTag: 'en',
      title: 'Title',
      subtitle: null,
      description: null,
      imageUrl: null,
      ...stringOverrides,
    },
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

  it('forwards a non-empty image_url verbatim', () => {
    const value = makeStrings();
    expect(buildItemStringChanges(value, { initialValue: value, imageUrlValue: 'https://example.test/a.png' }).changes)
      .toEqual({ image_url: 'https://example.test/a.png' });
  });

  it('sends image_url: null when the caller passes an empty string', () => {
    const value = makeStrings();
    expect(buildItemStringChanges(value, { initialValue: value, imageUrlValue: '' }).changes)
      .toEqual({ image_url: null });
  });
});

describe('buildItemAllStringsChanges', () => {
  it('skips the image_url field when the value is unchanged (null on backend, empty on form)', () => {
    const initial = makeStrings({ imageUrl: '' });
    const item = makeItem({ imageUrl: null });
    const result = buildItemAllStringsChanges([ initial ], [ initial ], 'en', item, '');
    expect(result).toEqual([]);
  });

  it('emits image_url: null when the user clears a previously set value', () => {
    const initial = makeStrings({ imageUrl: 'https://old.test/a.png' });
    const item = makeItem({ imageUrl: 'https://old.test/a.png' });
    const result = buildItemAllStringsChanges([ initial ], [ initial ], 'en', item, '');
    expect(result).toEqual([ { languageTag: 'en', changes: { image_url: null } } ]);
  });

  it('emits image_url with the new value when the user changes it', () => {
    const initial = makeStrings({ imageUrl: 'https://old.test/a.png' });
    const item = makeItem({ imageUrl: 'https://old.test/a.png' });
    const result = buildItemAllStringsChanges([ initial ], [ initial ], 'en', item, 'https://new.test/b.png');
    expect(result).toEqual([ { languageTag: 'en', changes: { image_url: 'https://new.test/b.png' } } ]);
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

  it('only carries image_url on the default-language record', () => {
    const en = makeStrings({ languageTag: 'en' });
    const fr = makeStrings({ languageTag: 'fr', title: 'Titre' });
    const item = makeItem({ imageUrl: null });
    const result = buildItemAllStringsChanges([ en, fr ], [ en, fr ], 'fr', item, 'https://new.test/img.png');
    expect(result).toEqual([ { languageTag: 'fr', changes: { image_url: 'https://new.test/img.png' } } ]);
  });
});
