import { pipe } from 'fp-ts/function';
import * as D from 'io-ts/Decoder';
import { itemEditPermDecoder } from '../models/domain/item-edit-permission';
import { itemGrantViewPermDecoder } from '../models/domain/item-grant-view-permission';
import { itemViewPermDecoder } from '../models/domain/item-view-permission';
import { itemWatchPermDecoder } from '../models/domain/item-watch-permission';

export const permissionsDecoder = pipe(
  itemViewPermDecoder,
  D.intersect(itemGrantViewPermDecoder),
  D.intersect(itemEditPermDecoder),
  D.intersect(itemWatchPermDecoder),
  D.intersect(
    D.struct({
      isOwner: D.boolean,
      canMakeSessionOfficial: D.boolean,
    })
  ),
);

export type Permissions = D.TypeOf<typeof permissionsDecoder>;
