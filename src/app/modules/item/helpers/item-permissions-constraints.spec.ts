import { canGrantViewValues, canViewValues } from './item-permissions';
import { validateCanGrantView, validateCanView } from './item-permissions-constraints';

function flatMap<T>(arr: T[][]) {
  return arr.reduce((acc, val) => acc.concat(val), []);
}

/**
 * Generate an array of object generated from all combination of objects values
 * The object should have arrays with the different values as attrbutes
 * Ex:
 * ```
 * combination({
 *  a: [1, 2],
 *  b: [3, 4]
 * })
 * ```
 * will return
 * ```
 * [
 *   {a: 1, b: 3},
 *   {a: 1, b: 4},
 *   {a: 2, b: 3},
 *   {a: 2, b: 4}
 * ]
 * ```
 */
function combinations<T>(object: { [e in keyof T]: readonly T[e][] }): T[] {
  return Object.keys(object).reduce(
    (res, key) => flatMap(res.map(t =>
      object[key as keyof T].map(value => {
        const element: T = { ...t };
        element[key as keyof T] = value;
        return element;
      })
    )), [{}] as T[]);
}

describe('"can_view" permissions constraints', () => {

  fit('should be a able to set to "none" ', () => {
    for (const giverPermissions of combinations({ canGrantView: canGrantViewValues })) {
      expect(validateCanView({ canView: 'none' }, giverPermissions)).toEqual({});
    }
  });

  fit('should be a able to set to "info" ', () => {
    for (const giverPermissions of combinations({
      canGrantView: [ 'enter', 'content', 'content_with_descendants', 'solution', 'solution_with_grant' ] as const
    })) {
      expect(validateCanView({ canView: 'info' }, giverPermissions)).toEqual({});
    }

    for (const giverPermissions of combinations({
      canGrantView: [ 'none' ] as const
    })) {
      expect(validateCanView({ canView: 'info' }, giverPermissions).canView).toBeDefined();
    }
  });

  fit('should be a able to set to "content" ', () => {
    for (const giverPermissions of combinations({
      canGrantView: [ 'content', 'content_with_descendants', 'solution', 'solution_with_grant' ] as const
    })) {
      expect(validateCanView({ canView: 'content' }, giverPermissions)).toEqual({});
    }

    for (const giverPermissions of combinations({
      canGrantView: [ 'none', 'enter' ] as const
    })) {
      expect(validateCanView({ canView: 'content' }, giverPermissions).canView).toBeDefined();
    }
  });

  fit('should be a able to set to "content_with_descendants" ', () => {
    for (const giverPermissions of combinations({
      canGrantView: [ 'content_with_descendants', 'solution', 'solution_with_grant' ] as const
    })) {
      expect(validateCanView({ canView: 'content_with_descendants' }, giverPermissions)).toEqual({});
    }

    for (const giverPermissions of combinations({
      canGrantView: [ 'none', 'enter', 'content' ] as const
    })) {
      expect(validateCanView({ canView: 'content_with_descendants' }, giverPermissions).canView).toBeDefined();
    }
  });

  fit('should be a able to set to "solution" ', () => {
    for (const giverPermissions of combinations({
      canGrantView: [ 'solution', 'solution_with_grant' ] as const
    })) {
      expect(validateCanView({ canView: 'solution' }, giverPermissions)).toEqual({});
    }

    for (const giverPermissions of combinations({
      canGrantView: [ 'none', 'enter', 'content', 'content_with_descendants' ] as const
    })) {
      expect(validateCanView({ canView: 'solution' }, giverPermissions).canView).toBeDefined();
    }
  });

});

describe('"can_grant_view" permissions constraints', () => {

  fit('should be a able to set to "none" ', () => {
    for (const p of combinations({
      receiverPermissions: combinations({
        canGrantView: [ 'none' ] as const,
        canView: canViewValues,
      }),
      giverPermissions: combinations({
        canGrantView: canGrantViewValues,
        isOwner: [ true, false ] as const,
      }),
    })) {
      expect(validateCanGrantView(p.receiverPermissions, p.giverPermissions)).toEqual({});
    }
  });

  fit('should be a able to set to "enter" ', () => {

    // giver can_grant_view == 'solution_with_grant' && receiver can_view >= 'info'
    for (const p of combinations({
      receiverPermissions: combinations({
        canGrantView: [ 'enter' ] as const,
        canView: [ 'info', 'content', 'content_with_descendants', 'solution' ] as const,
      }),
      giverPermissions: combinations({
        canGrantView: [ 'solution_with_grant' ] as const,
        isOwner: [ true, false ] as const,
      }),
    })) {
      expect(validateCanGrantView(p.receiverPermissions, p.giverPermissions)).toEqual({});
    }

    // receiver can_view < 'info'
    for (const p of combinations({
      receiverPermissions: combinations({
        canGrantView: [ 'enter' ] as const,
        canView: [ 'none' ] as const,
      }),
      giverPermissions: combinations({
        canGrantView: canGrantViewValues,
        isOwner: [ true, false ] as const,
      }),
    })) {
      expect(validateCanGrantView(p.receiverPermissions, p.giverPermissions).canGrantView).toBeDefined();
    }

    // giver can_grant_view !== 'solution_with_grant'
    for (const p of combinations({
      receiverPermissions: combinations({
        canGrantView: [ 'enter' ] as const,
        canView: canViewValues,
      }),
      giverPermissions: combinations({
        canGrantView: [ 'none', 'enter', 'content', 'content_with_descendants', 'solution' ] as const,
        isOwner: [ true, false ] as const,
      }),
    })) {
      expect(validateCanGrantView(p.receiverPermissions, p.giverPermissions).canGrantView).toBeDefined();
    }
  });

  fit('should be a able to set to "content" ', () => {

    // giver can_grant_view == 'solution_with_grant' && receiver can_view >= 'content'
    for (const p of combinations({
      receiverPermissions: combinations({
        canGrantView: [ 'content' ] as const,
        canView: [ 'content', 'content_with_descendants', 'solution' ] as const,
      }),
      giverPermissions: combinations({
        canGrantView: [ 'solution_with_grant' ] as const,
        isOwner: [ true, false ] as const,
      }),
    })) {
      expect(validateCanGrantView(p.receiverPermissions, p.giverPermissions)).toEqual({});
    }

    // receiver can_view < 'content'
    for (const p of combinations({
      receiverPermissions: combinations({
        canGrantView: [ 'content' ] as const,
        canView: [ 'none', 'info' ] as const,
      }),
      giverPermissions: combinations({
        canGrantView: canGrantViewValues,
        isOwner: [ true, false ] as const,
      }),
    })) {
      expect(validateCanGrantView(p.receiverPermissions, p.giverPermissions).canGrantView).toBeDefined();
    }

    // giver can_grant_view !== 'solution_with_grant'
    for (const p of combinations({
      receiverPermissions: combinations({
        canGrantView: [ 'content' ] as const,
        canView: canViewValues,
      }),
      giverPermissions: combinations({
        canGrantView: [ 'none', 'enter', 'content', 'content_with_descendants', 'solution' ] as const,
        isOwner: [ true, false ] as const,
      }),
    })) {
      expect(validateCanGrantView(p.receiverPermissions, p.giverPermissions).canGrantView).toBeDefined();
    }
  });

  fit('should be a able to set to "content_with_descendants" ', () => {

    // giver can_grant_view == 'solution_with_grant' && receiver can_view >= 'content_with_descendants'
    for (const p of combinations({
      receiverPermissions: combinations({
        canGrantView: [ 'content_with_descendants' ] as const,
        canView: [ 'content_with_descendants', 'solution' ] as const,
      }),
      giverPermissions: combinations({
        canGrantView: [ 'solution_with_grant' ] as const,
        isOwner: [ true, false ] as const,
      }),
    })) {
      expect(validateCanGrantView(p.receiverPermissions, p.giverPermissions)).toEqual({});
    }

    // receiver can_view < 'content_with_descendants'
    for (const p of combinations({
      receiverPermissions: combinations({
        canGrantView: [ 'content_with_descendants' ] as const,
        canView: [ 'none', 'info', 'content' ] as const,
      }),
      giverPermissions: combinations({
        canGrantView: canGrantViewValues,
        isOwner: [ true, false ] as const,
      }),
    })) {
      expect(validateCanGrantView(p.receiverPermissions, p.giverPermissions).canGrantView).toBeDefined();
    }

    // giver can_grant_view !== 'solution_with_grant'
    for (const p of combinations({
      receiverPermissions: combinations({
        canGrantView: [ 'content_with_descendants' ] as const,
        canView: canViewValues,
      }),
      giverPermissions: combinations({
        canGrantView: [ 'none', 'enter', 'content', 'content_with_descendants', 'solution' ] as const,
        isOwner: [ true, false ] as const,
      }),
    })) {
      expect(validateCanGrantView(p.receiverPermissions, p.giverPermissions).canGrantView).toBeDefined();
    }
  });

  fit('should be a able to set to "solution" ', () => {

    // giver can_grant_view == 'solution_with_grant' && receiver can_view >= 'solution'
    for (const p of combinations({
      receiverPermissions: combinations({
        canGrantView: [ 'solution' ] as const,
        canView: [ 'solution' ] as const,
      }),
      giverPermissions: combinations({
        canGrantView: [ 'solution_with_grant' ] as const,
        isOwner: [ true, false ] as const,
      }),
    })) {
      expect(validateCanGrantView(p.receiverPermissions, p.giverPermissions)).toEqual({});
    }

    // receiver can_view < 'solution'
    for (const p of combinations({
      receiverPermissions: combinations({
        canGrantView: [ 'solution' ] as const,
        canView: [ 'none', 'info', 'content', 'content_with_descendants' ] as const,
      }),
      giverPermissions: combinations({
        canGrantView: canGrantViewValues,
        isOwner: [ true, false ] as const,
      }),
    })) {
      expect(validateCanGrantView(p.receiverPermissions, p.giverPermissions).canGrantView).toBeDefined();
    }

    // giver can_grant_view !== 'solution_with_grant'
    for (const p of combinations({
      receiverPermissions: combinations({
        canGrantView: [ 'solution' ] as const,
        canView: canViewValues,
      }),
      giverPermissions: combinations({
        canGrantView: [ 'none', 'enter', 'content', 'content_with_descendants', 'solution' ] as const,
        isOwner: [ true, false ] as const,
      }),
    })) {
      expect(validateCanGrantView(p.receiverPermissions, p.giverPermissions).canGrantView).toBeDefined();
    }
  });

  fit('should be a able to set to "solution_with_grant" ', () => {

    // giver is_owner == true && receiver can_view >= 'solution'
    for (const p of combinations({
      receiverPermissions: combinations({
        canGrantView: [ 'solution_with_grant' ] as const,
        canView: [ 'solution' ] as const,
      }),
      giverPermissions: combinations({
        canGrantView: canGrantViewValues,
        isOwner: [ true ] as const,
      }),
    })) {
      expect(validateCanGrantView(p.receiverPermissions, p.giverPermissions)).toEqual({});
    }

    // receiver can_view < 'solution'
    for (const p of combinations({
      receiverPermissions: combinations({
        canGrantView: [ 'solution_with_grant' ] as const,
        canView: [ 'none', 'info', 'content', 'content_with_descendants' ] as const,
      }),
      giverPermissions: combinations({
        canGrantView: canGrantViewValues,
        isOwner: [ true, false ] as const,
      }),
    })) {
      expect(validateCanGrantView(p.receiverPermissions, p.giverPermissions).canGrantView).toBeDefined();
    }

    // giver is_owner !== true
    for (const p of combinations({
      receiverPermissions: combinations({
        canGrantView: [ 'solution_with_grant' ] as const,
        canView: canViewValues,
      }),
      giverPermissions: combinations({
        canGrantView: canGrantViewValues,
        isOwner: [ false ] as const,
      }),
    })) {
      expect(validateCanGrantView(p.receiverPermissions, p.giverPermissions).canGrantView).toBeDefined();
    }
  });
});
