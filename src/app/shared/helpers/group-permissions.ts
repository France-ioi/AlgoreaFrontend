import { pipe } from 'fp-ts/function';
import * as D from 'io-ts/Decoder';
import { itemViewPermDecoder } from '../models/domain/item-view-permission';

export const permissionsDecoder = pipe(
  itemViewPermDecoder,
  D.intersect(
    D.struct({
      canWatch: D.literal('none','result','answer','answer_with_grant'),
      canEdit: D.literal('none','children','all','all_with_grant'),
      canGrantView: D.literal('none','enter','content','content_with_descendants','solution','solution_with_grant'),
      isOwner: D.boolean,
      canMakeSessionOfficial: D.boolean,
    })
  ),
);

export type Permissions = D.TypeOf<typeof permissionsDecoder>;
