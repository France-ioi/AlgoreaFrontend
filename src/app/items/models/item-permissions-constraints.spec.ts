import { ItemGrantViewPerm, itemGrantViewPermValues } from 'src/app/items/models/item-grant-view-permission';
import { ItemViewPerm, itemViewPermValues } from 'src/app/items/models/item-view-permission';
import { ItemEditPerm, itemEditPermValues } from 'src/app/items/models/item-edit-permission';
import { ItemWatchPerm, itemWatchPermValues } from 'src/app/items/models/item-watch-permission';
import {
  validateCanEdit,
  validateCanGrantView,
  validateCanMakeSessionOfficial,
  validateCanView,
  validateCanWatch,
  validateIsOwner
} from './item-permissions-constraints';

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
function combinations<T extends object>(object: { [e in keyof T]: readonly T[e][] }): T[] {
  return Object.keys(object).reduce<T[]>(
    (res, key) => flatMap(res.map(t =>
      object[key as keyof T].map(value => ({ ...t, [key as keyof T]: value }))
    )), [{}] as T[]);
}

describe('"can_view" permissions constraints', () => {

  it('should be a able to set to "none" ', () => {
    for (const giverPermissions of combinations({ canGrantView: itemGrantViewPermValues })) {
      expect(validateCanView({ canView: ItemViewPerm.None }, giverPermissions)).toEqual([]);
    }
  });

  it('should be a able to set to "info" ', () => {
    for (const giverPermissions of combinations({
      canGrantView: [
        ItemGrantViewPerm.Enter,
        ItemGrantViewPerm.Content,
        ItemGrantViewPerm.ContentWithDescendants,
        ItemGrantViewPerm.Solution,
        ItemGrantViewPerm.SolutionWithGrant
      ] as const
    })) {
      expect(validateCanView({ canView: ItemViewPerm.Info }, giverPermissions)).toEqual([]);
    }

    for (const giverPermissions of combinations({
      canGrantView: [ ItemGrantViewPerm.None ] as const
    })) {
      expect(validateCanView({ canView: ItemViewPerm.Info }, giverPermissions)[0]).toBeDefined();
    }
  });

  it('should be a able to set to "content" ', () => {
    for (const giverPermissions of combinations({
      canGrantView: [
        ItemGrantViewPerm.Content,
        ItemGrantViewPerm.ContentWithDescendants,
        ItemGrantViewPerm.Solution,
        ItemGrantViewPerm.SolutionWithGrant
      ] as const
    })) {
      expect(validateCanView({ canView: ItemViewPerm.Content }, giverPermissions)).toEqual([]);
    }

    for (const giverPermissions of combinations({
      canGrantView: [ ItemGrantViewPerm.None, ItemGrantViewPerm.Enter ] as const
    })) {
      expect(validateCanView({ canView: ItemViewPerm.Content }, giverPermissions)[0]).toBeDefined();
    }
  });

  it('should be a able to set to "content_with_descendants" ', () => {
    for (const giverPermissions of combinations({
      canGrantView: [ ItemGrantViewPerm.ContentWithDescendants, ItemGrantViewPerm.Solution, ItemGrantViewPerm.SolutionWithGrant ] as const
    })) {
      expect(validateCanView({ canView: ItemViewPerm.ContentWithDescendants }, giverPermissions)).toEqual([]);
    }

    for (const giverPermissions of combinations({
      canGrantView: [ ItemGrantViewPerm.None, ItemGrantViewPerm.Enter, ItemGrantViewPerm.Content ] as const
    })) {
      expect(validateCanView({ canView: ItemViewPerm.ContentWithDescendants }, giverPermissions)[0]).toBeDefined();
    }
  });

  it('should be a able to set to "solution" ', () => {
    for (const giverPermissions of combinations({
      canGrantView: [ ItemGrantViewPerm.Solution, ItemGrantViewPerm.SolutionWithGrant ] as const
    })) {
      expect(validateCanView({ canView: ItemViewPerm.Solution }, giverPermissions)).toEqual([]);
    }

    for (const giverPermissions of combinations({
      canGrantView: [
        ItemGrantViewPerm.None,
        ItemGrantViewPerm.Enter,
        ItemGrantViewPerm.Content,
        ItemGrantViewPerm.ContentWithDescendants
      ] as const
    })) {
      expect(validateCanView({ canView: ItemViewPerm.Solution }, giverPermissions)[0]).toBeDefined();
    }
  });

});

describe('"can_grant_view" permissions constraints', () => {

  it('should be a able to set to "none" ', () => {
    for (const p of combinations({
      receiverPermissions: combinations({
        canGrantView: [ ItemGrantViewPerm.None ] as const,
        canView: itemViewPermValues,
      }),
      giverPermissions: combinations({
        canGrantView: itemGrantViewPermValues,
        isOwner: [ true, false ] as const,
      }),
    })) {
      expect(validateCanGrantView(p.receiverPermissions, p.giverPermissions)).toEqual([]);
    }
  });

  it('should be a able to set to "enter" ', () => {

    // giver can_grant_view == ItemGrantViewPerm.SolutionWithGrant && receiver can_view >= ItemViewPerm.Info
    for (const p of combinations({
      receiverPermissions: combinations({
        canGrantView: [ ItemGrantViewPerm.Enter ] as const,
        canView: [ ItemViewPerm.Info, ItemViewPerm.Content, ItemViewPerm.ContentWithDescendants, ItemViewPerm.Solution ] as const,
      }),
      giverPermissions: combinations({
        canGrantView: [ ItemGrantViewPerm.SolutionWithGrant ] as const,
        isOwner: [ true, false ] as const,
      }),
    })) {
      expect(validateCanGrantView(p.receiverPermissions, p.giverPermissions)).toEqual([]);
    }

    // receiver can_view < ItemViewPerm.Info
    for (const p of combinations({
      receiverPermissions: combinations({
        canGrantView: [ ItemGrantViewPerm.Enter ] as const,
        canView: [ ItemViewPerm.None ] as const,
      }),
      giverPermissions: combinations({
        canGrantView: itemGrantViewPermValues,
        isOwner: [ true, false ] as const,
      }),
    })) {
      expect(validateCanGrantView(p.receiverPermissions, p.giverPermissions)[0]).toBeDefined();
    }

    // giver can_grant_view !== ItemGrantViewPerm.SolutionWithGrant
    for (const p of combinations({
      receiverPermissions: combinations({
        canGrantView: [ ItemGrantViewPerm.Enter ] as const,
        canView: itemViewPermValues,
      }),
      giverPermissions: combinations({
        canGrantView: [
          ItemGrantViewPerm.None,
          ItemGrantViewPerm.Enter,
          ItemGrantViewPerm.Content,
          ItemGrantViewPerm.ContentWithDescendants,
          ItemGrantViewPerm.Solution
        ] as const,
        isOwner: [ true, false ] as const,
      }),
    })) {
      expect(validateCanGrantView(p.receiverPermissions, p.giverPermissions)[0]).toBeDefined();
    }
  });

  it('should be a able to set to "content" ', () => {

    // giver can_grant_view == ItemGrantViewPerm.SolutionWithGrant && receiver can_view >= ItemViewPerm.Content
    for (const p of combinations({
      receiverPermissions: combinations({
        canGrantView: [ ItemGrantViewPerm.Content ] as const,
        canView: [ ItemViewPerm.Content, ItemViewPerm.ContentWithDescendants, ItemViewPerm.Solution ] as const,
      }),
      giverPermissions: combinations({
        canGrantView: [ ItemGrantViewPerm.SolutionWithGrant ] as const,
        isOwner: [ true, false ] as const,
      }),
    })) {
      expect(validateCanGrantView(p.receiverPermissions, p.giverPermissions)).toEqual([]);
    }

    // receiver can_view < ItemViewPerm.Content
    for (const p of combinations({
      receiverPermissions: combinations({
        canGrantView: [ ItemGrantViewPerm.Content ] as const,
        canView: [ ItemViewPerm.None, ItemViewPerm.Info ] as const,
      }),
      giverPermissions: combinations({
        canGrantView: itemGrantViewPermValues,
        isOwner: [ true, false ] as const,
      }),
    })) {
      expect(validateCanGrantView(p.receiverPermissions, p.giverPermissions)[0]).toBeDefined();
    }

    // giver can_grant_view !== ItemGrantViewPerm.SolutionWithGrant
    for (const p of combinations({
      receiverPermissions: combinations({
        canGrantView: [ ItemGrantViewPerm.Content ] as const,
        canView: itemViewPermValues,
      }),
      giverPermissions: combinations({
        canGrantView: [
          ItemGrantViewPerm.None,
          ItemGrantViewPerm.Enter,
          ItemGrantViewPerm.Content,
          ItemGrantViewPerm.ContentWithDescendants,
          ItemGrantViewPerm.Solution
        ] as const,
        isOwner: [ true, false ] as const,
      }),
    })) {
      expect(validateCanGrantView(p.receiverPermissions, p.giverPermissions)[0]).toBeDefined();
    }
  });

  it('should be a able to set to "content_with_descendants" ', () => {

    // giver can_grant_view == ItemGrantViewPerm.SolutionWithGrant && receiver can_view >= ItemViewPerm.ContentWithDescendants
    for (const p of combinations({
      receiverPermissions: combinations({
        canGrantView: [ ItemGrantViewPerm.ContentWithDescendants ] as const,
        canView: [ ItemViewPerm.ContentWithDescendants, ItemViewPerm.Solution ] as const,
      }),
      giverPermissions: combinations({
        canGrantView: [ ItemGrantViewPerm.SolutionWithGrant ] as const,
        isOwner: [ true, false ] as const,
      }),
    })) {
      expect(validateCanGrantView(p.receiverPermissions, p.giverPermissions)).toEqual([]);
    }

    // receiver can_view < ItemViewPerm.ContentWithDescendants
    for (const p of combinations({
      receiverPermissions: combinations({
        canGrantView: [ ItemGrantViewPerm.ContentWithDescendants ] as const,
        canView: [ ItemViewPerm.None, ItemViewPerm.Info, ItemViewPerm.Content ] as const,
      }),
      giverPermissions: combinations({
        canGrantView: itemGrantViewPermValues,
        isOwner: [ true, false ] as const,
      }),
    })) {
      expect(validateCanGrantView(p.receiverPermissions, p.giverPermissions)[0]).toBeDefined();
    }

    // giver can_grant_view !== ItemGrantViewPerm.SolutionWithGrant
    for (const p of combinations({
      receiverPermissions: combinations({
        canGrantView: [ ItemGrantViewPerm.ContentWithDescendants ] as const,
        canView: itemViewPermValues,
      }),
      giverPermissions: combinations({
        canGrantView: [
          ItemGrantViewPerm.None,
          ItemGrantViewPerm.Enter,
          ItemGrantViewPerm.Content,
          ItemGrantViewPerm.ContentWithDescendants,
          ItemGrantViewPerm.Solution
        ] as const,
        isOwner: [ true, false ] as const,
      }),
    })) {
      expect(validateCanGrantView(p.receiverPermissions, p.giverPermissions)[0]).toBeDefined();
    }
  });

  it('should be a able to set to "solution" ', () => {

    // giver can_grant_view == ItemGrantViewPerm.SolutionWithGrant && receiver can_view >= ItemViewPerm.Solution
    for (const p of combinations({
      receiverPermissions: combinations({
        canGrantView: [ ItemGrantViewPerm.Solution ] as const,
        canView: [ ItemViewPerm.Solution ] as const,
      }),
      giverPermissions: combinations({
        canGrantView: [ ItemGrantViewPerm.SolutionWithGrant ] as const,
        isOwner: [ true, false ] as const,
      }),
    })) {
      expect(validateCanGrantView(p.receiverPermissions, p.giverPermissions)).toEqual([]);
    }

    // receiver can_view < ItemViewPerm.Solution
    for (const p of combinations({
      receiverPermissions: combinations({
        canGrantView: [ ItemGrantViewPerm.Solution ] as const,
        canView: [ ItemViewPerm.None, ItemViewPerm.Info, ItemViewPerm.Content, ItemViewPerm.ContentWithDescendants ] as const,
      }),
      giverPermissions: combinations({
        canGrantView: itemGrantViewPermValues,
        isOwner: [ true, false ] as const,
      }),
    })) {
      expect(validateCanGrantView(p.receiverPermissions, p.giverPermissions)[0]).toBeDefined();
    }

    // giver can_grant_view !== ItemGrantViewPerm.SolutionWithGrant
    for (const p of combinations({
      receiverPermissions: combinations({
        canGrantView: [ ItemGrantViewPerm.Solution ] as const,
        canView: itemViewPermValues,
      }),
      giverPermissions: combinations({
        canGrantView: [
          ItemGrantViewPerm.None,
          ItemGrantViewPerm.Enter,
          ItemGrantViewPerm.Content,
          ItemGrantViewPerm.ContentWithDescendants,
          ItemGrantViewPerm.Solution
        ] as const,
        isOwner: [ true, false ] as const,
      }),
    })) {
      expect(validateCanGrantView(p.receiverPermissions, p.giverPermissions)[0]).toBeDefined();
    }
  });

  it('should be a able to set to "solution_with_grant" ', () => {

    // giver is_owner == true && receiver can_view >= ItemViewPerm.Solution
    for (const p of combinations({
      receiverPermissions: combinations({
        canGrantView: [ ItemGrantViewPerm.SolutionWithGrant ] as const,
        canView: [ ItemViewPerm.Solution ] as const,
      }),
      giverPermissions: combinations({
        canGrantView: itemGrantViewPermValues,
        isOwner: [ true ] as const,
      }),
    })) {
      expect(validateCanGrantView(p.receiverPermissions, p.giverPermissions)).toEqual([]);
    }

    // receiver can_view < ItemViewPerm.Solution
    for (const p of combinations({
      receiverPermissions: combinations({
        canGrantView: [ ItemGrantViewPerm.SolutionWithGrant ] as const,
        canView: [ ItemViewPerm.None, ItemViewPerm.Info, ItemViewPerm.Content, ItemViewPerm.ContentWithDescendants ] as const,
      }),
      giverPermissions: combinations({
        canGrantView: itemGrantViewPermValues,
        isOwner: [ true, false ] as const,
      }),
    })) {
      expect(validateCanGrantView(p.receiverPermissions, p.giverPermissions)[0]).toBeDefined();
    }

    // giver is_owner !== true
    for (const p of combinations({
      receiverPermissions: combinations({
        canGrantView: [ ItemGrantViewPerm.SolutionWithGrant ] as const,
        canView: itemViewPermValues,
      }),
      giverPermissions: combinations({
        canGrantView: itemGrantViewPermValues,
        isOwner: [ false ] as const,
      }),
    })) {
      expect(validateCanGrantView(p.receiverPermissions, p.giverPermissions)[0]).toBeDefined();
    }
  });
});

describe('"can_watch" permissions constraints', () => {

  it('should be a able to set to "none" ', () => {
    for (const p of combinations({
      receiverPermissions: combinations({
        canWatch: [ ItemWatchPerm.None ] as const,
        canView: itemViewPermValues,
      }),
      giverPermissions: combinations({
        canWatch: itemWatchPermValues,
        isOwner: [ true, false ] as const,
      }),
    })) {
      expect(validateCanWatch(p.receiverPermissions, p.giverPermissions)).toEqual([]);
    }
  });

  const values = [ ItemWatchPerm.Result, ItemWatchPerm.Answer ] as const;

  values.forEach(value => {
    it(`should be a able to set to "${value}" `, () => {

      // giver can_watch == ItemWatchPerm.AnswerWithGrant && receiver can_view >= ItemViewPerm.Content
      for (const p of combinations({
        receiverPermissions: combinations({
          canWatch: [ value ],
          canView: [ ItemViewPerm.Content, ItemViewPerm.ContentWithDescendants, ItemViewPerm.Solution ] as const,
        }),
        giverPermissions: combinations({
          canWatch: [ ItemWatchPerm.AnswerWithGrant ] as const,
          isOwner: [ true, false ] as const,
        }),
      })) {
        expect(validateCanWatch(p.receiverPermissions, p.giverPermissions)).toEqual([]);
      }

      // receiver can_view < ItemViewPerm.Content
      for (const p of combinations({
        receiverPermissions: combinations({
          canWatch: [ value ],
          canView: [ ItemViewPerm.None, ItemViewPerm.Info ] as const,
        }),
        giverPermissions: combinations({
          canWatch: itemWatchPermValues,
          isOwner: [ true, false ] as const,
        }),
      })) {
        expect(validateCanWatch(p.receiverPermissions, p.giverPermissions)[0]).toBeDefined();
      }

      // giver can_watch !== ItemWatchPerm.AnswerWithGrant
      for (const p of combinations({
        receiverPermissions: combinations({
          canWatch: [ value ],
          canView: itemViewPermValues,
        }),
        giverPermissions: combinations({
          canWatch: [ ItemWatchPerm.None, ItemWatchPerm.Result, ItemWatchPerm.Answer ] as const,
          isOwner: [ true, false ] as const,
        }),
      })) {
        expect(validateCanWatch(p.receiverPermissions, p.giverPermissions)[0]).toBeDefined();
      }
    });
  });

  it('should be a able to set to "answer_with_grant" ', () => {
    for (const p of combinations({
      receiverPermissions: combinations({
        canWatch: [ ItemWatchPerm.AnswerWithGrant ] as const,
        canView: [ ItemViewPerm.Content, ItemViewPerm.ContentWithDescendants, ItemViewPerm.Solution ] as const,
      }),
      giverPermissions: combinations({
        canWatch: itemWatchPermValues,
        isOwner: [ true ] as const,
      }),
    })) {
      expect(validateCanWatch(p.receiverPermissions, p.giverPermissions)).toEqual([]);
    }

    // receiver can_view < ItemViewPerm.Content
    for (const p of combinations({
      receiverPermissions: combinations({
        canWatch: [ ItemWatchPerm.AnswerWithGrant ] as const,
        canView: [ ItemViewPerm.None, ItemViewPerm.Info ] as const,
      }),
      giverPermissions: combinations({
        canWatch: itemWatchPermValues,
        isOwner: [ true, false ] as const,
      }),
    })) {
      expect(validateCanWatch(p.receiverPermissions, p.giverPermissions)[0]).toBeDefined();
    }

    // giver not owner
    for (const p of combinations({
      receiverPermissions: combinations({
        canWatch: [ ItemWatchPerm.AnswerWithGrant ] as const,
        canView: itemViewPermValues,
      }),
      giverPermissions: combinations({
        canWatch: itemWatchPermValues,
        isOwner: [ false ] as const,
      }),
    })) {
      expect(validateCanWatch(p.receiverPermissions, p.giverPermissions)[0]).toBeDefined();
    }
  });

});

describe('"can_edit" permissions constraints', () => {

  it('should be a able to set to "none" ', () => {
    for (const p of combinations({
      receiverPermissions: combinations({
        canEdit: [ ItemEditPerm.None ] as const,
        canView: itemViewPermValues,
      }),
      giverPermissions: combinations({
        canEdit: itemEditPermValues,
        isOwner: [ true, false ] as const,
      }),
    })) {
      expect(validateCanEdit(p.receiverPermissions, p.giverPermissions)).toEqual([]);
    }
  });

  const values = [ ItemEditPerm.Children, ItemEditPerm.All ] as const;

  values.forEach(value => {
    it(`should be a able to set to "${value}" `, () => {

      // giver can_edit == ItemEditPerm.AllWithGrant && receiver can_view >= ItemViewPerm.Content
      for (const p of combinations({
        receiverPermissions: combinations({
          canEdit: [ value ],
          canView: [ ItemViewPerm.Content, ItemViewPerm.ContentWithDescendants, ItemViewPerm.Solution ] as const,
        }),
        giverPermissions: combinations({
          canEdit: [ ItemEditPerm.AllWithGrant ] as const,
          isOwner: [ true, false ] as const,
        }),
      })) {
        expect(validateCanEdit(p.receiverPermissions, p.giverPermissions)).toEqual([]);
      }

      // receiver can_view < ItemViewPerm.Content
      for (const p of combinations({
        receiverPermissions: combinations({
          canEdit: [ value ],
          canView: [ ItemViewPerm.None, ItemViewPerm.Info ] as const,
        }),
        giverPermissions: combinations({
          canEdit: itemEditPermValues,
          isOwner: [ true, false ] as const,
        }),
      })) {
        expect(validateCanEdit(p.receiverPermissions, p.giverPermissions)[0]).toBeDefined();
      }

      // giver can_edit !== ItemEditPerm.AllWithGrant
      for (const p of combinations({
        receiverPermissions: combinations({
          canEdit: [ value ],
          canView: itemViewPermValues,
        }),
        giverPermissions: combinations({
          canEdit: [ ItemEditPerm.None, ItemEditPerm.Children, ItemEditPerm.All ] as const,
          isOwner: [ true, false ] as const,
        }),
      })) {
        expect(validateCanEdit(p.receiverPermissions, p.giverPermissions)[0]).toBeDefined();
      }
    });
  });

  it('should be a able to set to "all_with_grant" ', () => {
    for (const p of combinations({
      receiverPermissions: combinations({
        canEdit: [ ItemEditPerm.AllWithGrant ] as const,
        canView: [ ItemViewPerm.Content, ItemViewPerm.ContentWithDescendants, ItemViewPerm.Solution ] as const,
      }),
      giverPermissions: combinations({
        canEdit: itemEditPermValues,
        isOwner: [ true ] as const,
      }),
    })) {
      expect(validateCanEdit(p.receiverPermissions, p.giverPermissions)).toEqual([]);
    }

    // receiver can_view < ItemViewPerm.Content
    for (const p of combinations({
      receiverPermissions: combinations({
        canEdit: [ ItemEditPerm.AllWithGrant ] as const,
        canView: [ ItemViewPerm.None, ItemViewPerm.Info ] as const,
      }),
      giverPermissions: combinations({
        canEdit: itemEditPermValues,
        isOwner: [ true, false ] as const,
      }),
    })) {
      expect(validateCanEdit(p.receiverPermissions, p.giverPermissions)[0]).toBeDefined();
    }

    // giver not owner
    for (const p of combinations({
      receiverPermissions: combinations({
        canEdit: [ ItemEditPerm.AllWithGrant ] as const,
        canView: itemViewPermValues,
      }),
      giverPermissions: combinations({
        canEdit: itemEditPermValues,
        isOwner: [ false ] as const,
      }),
    })) {
      expect(validateCanEdit(p.receiverPermissions, p.giverPermissions)[0]).toBeDefined();
    }
  });

});

describe('"can_make_session_official" permissions constraints', () => {
  it('should be a able to set to "false" ', () => {
    for (const p of combinations({
      receiverPermissions: combinations({
        canMakeSessionOfficial: [ false ] as const,
        canView: itemViewPermValues,
      }),
      giverPermissions: combinations({
        isOwner: [ true, false ] as const,
      }),
    })) {
      expect(validateCanMakeSessionOfficial(p.receiverPermissions, p.giverPermissions)).toEqual([]);
    }
  });

  it('should be a able to set to "true" ', () => {

    // giver is owner and receiver can_view >= ItemViewPerm.Info
    for (const receiverPermissions of combinations({
      canMakeSessionOfficial: [ true ] as const,
      canView: [ ItemViewPerm.Info, ItemViewPerm.Content, ItemViewPerm.ContentWithDescendants, ItemViewPerm.Solution ] as const,
    })) {
      expect(validateCanMakeSessionOfficial(receiverPermissions, { isOwner: true })).toEqual([]);
    }

    // receiver can_view < ItemViewPerm.Info
    for (const giverPermissions of combinations({
      isOwner: [ true, false ] as const,
    })) {
      expect(validateCanMakeSessionOfficial({
        canMakeSessionOfficial: true ,
        canView: ItemViewPerm.None,
      }, giverPermissions)[0]).toBeDefined();
    }

    // giver not owner
    for (const receiverPermissions of combinations({
      canMakeSessionOfficial: [ true ] as const,
      canView: itemViewPermValues,
    })) {
      expect(validateCanMakeSessionOfficial(receiverPermissions, { isOwner: false })[0]).toBeDefined();
    }
  });
});

describe('"is_owner" permissions constraints', () => {
  it('should be a able to set to "false" ', () => {
    expect(validateIsOwner({ isOwner: false }, { isOwner: true })).toEqual([]);
    expect(validateIsOwner({ isOwner: false }, { isOwner: false })).toEqual([]);
  });

  it('should be a able to set to "true" ', () => {
    expect(validateIsOwner({ isOwner: true }, { isOwner: true })).toEqual([]);
    expect(validateIsOwner({ isOwner: true }, { isOwner: false })[0]).toBeDefined();
  });
});
