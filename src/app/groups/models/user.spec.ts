import { snakeToCamelKeys } from 'src/app/utils/case_conversion';
import { userSchema } from './user';

describe('userSchema', () => {
  it('reads names from profile and ignores retired free text, website, and grade', () => {
    const user = userSchema.parse(snakeToCamelKeys({
      group_id: '2',
      login: 'ada',
      temp_user: false,
      is_current_user: true,
      ancestors_current_user_is_manager_of: [],
      profile: {
        first_name: 'Ada',
        last_name: 'Lovelace',
        free_text: 'hello',
        web_site: 'https://ada.example',
      },
      grade: null,
      free_text: 'hello',
      web_site: 'https://ada.example',
    }));

    expect(user.firstName).toBe('Ada');
    expect(user.lastName).toBe('Lovelace');
    expect(user.profile).toEqual({ firstName: 'Ada', lastName: 'Lovelace' });
    expect(Object.keys(user)).not.toContain('grade');
    expect(Object.keys(user)).not.toContain('freeText');
    expect(Object.keys(user)).not.toContain('webSite');
  });
});
