import { pipe } from 'fp-ts/function';
import * as D from 'io-ts/Decoder';
import { itemEditPermDecoder } from '../models/domain/item-edit-permission';
import { itemGrantViewPermDecoder } from '../models/domain/item-grant-view-permission';
import { itemViewPermDecoder } from '../models/domain/item-view-permission';

export const permissionsDecoder = pipe(
  itemViewPermDecoder,
  D.intersect(itemGrantViewPermDecoder),
  D.intersect(itemEditPermDecoder),
  D.intersect(
    D.struct({
      canWatch: D.literal('none','result','answer','answer_with_grant'),
      isOwner: D.boolean,
      canMakeSessionOfficial: D.boolean,
    })
  ),
);

export type Permissions = D.TypeOf<typeof permissionsDecoder>;
