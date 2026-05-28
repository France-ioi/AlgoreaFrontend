import {
  applyLocalCommitToFormValue,
  hasLocalOnlyPendingRemovals,
} from './all-strings-form-value';
import { StringsValue } from './item-strings-control/item-strings-control.component';

const en: StringsValue = {
  languageTag: 'en',
  title: 'Title',
  subtitle: '',
  description: '',
  imageUrl: '',
};

describe('all-strings-form-value', () => {
  it('detects local-only pending removals', () => {
    expect(hasLocalOnlyPendingRemovals({ strings: [ en ], pendingDeletions: [ 'fr' ] }, [ 'en' ])).toBeTrue();
    expect(hasLocalOnlyPendingRemovals({ strings: [ en ], pendingDeletions: [ 'en' ] }, [ 'en', 'fr' ])).toBeFalse();
  });

  it('drops locally-added pending-deletion languages on commit', () => {
    const { value, changed } = applyLocalCommitToFormValue(
      { strings: [ en ], pendingDeletions: [ 'fr' ] },
      [ 'en' ],
    );
    expect(changed).toBeTrue();
    expect(value.strings).toEqual([ en ]);
    expect(value.pendingDeletions).toEqual([]);
  });
});
