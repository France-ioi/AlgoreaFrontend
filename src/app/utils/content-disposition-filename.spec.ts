import { getContentDispositionFilename } from './content-disposition-filename';

describe('getContentDispositionFilename', () => {
  it('returns fallback when Content-Disposition is missing', () => {
    expect(getContentDispositionFilename(null, '42')).toBe('groups_progress_with_answers_for_group-42.zip');
  });

  it('extracts a quoted filename', () => {
    const header = 'attachment; filename="groups_progress_with_answers_for_group-42-and_child_items_of-210.zip"';
    expect(getContentDispositionFilename(header, '42')).toBe(
      'groups_progress_with_answers_for_group-42-and_child_items_of-210.zip',
    );
  });

  it('extracts an unquoted filename', () => {
    const header = 'attachment; filename=export.zip';
    expect(getContentDispositionFilename(header, '42')).toBe('export.zip');
  });

  it('extracts a UTF-8 encoded filename', () => {
    const header = 'attachment; filename*=UTF-8\'\'groups_progress_with_answers_for_group-42.zip';
    expect(getContentDispositionFilename(header, '42')).toBe('groups_progress_with_answers_for_group-42.zip');
  });

  it('returns fallback for an empty Content-Disposition header', () => {
    expect(getContentDispositionFilename('', '99')).toBe('groups_progress_with_answers_for_group-99.zip');
  });

  it('returns fallback when Content-Disposition has no filename', () => {
    expect(getContentDispositionFilename('attachment', '42')).toBe('groups_progress_with_answers_for_group-42.zip');
  });

  it('trims whitespace from an unquoted filename', () => {
    const header = 'attachment; filename= export.zip ';
    expect(getContentDispositionFilename(header, '42')).toBe('export.zip');
  });
});
