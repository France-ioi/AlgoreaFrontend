import * as D from 'io-ts/Decoder';
import { pipe } from 'fp-ts/function';
import { dateDecoder } from 'src/app/utils/decoders';
import { threadEventDecoder } from './threads-events';

export const incomingThreadEventDecoder = pipe(
  D.struct({
    createdBy: D.string,
    thread: D.struct({
      participantId: D.string,
      itemId: D.string,
    }),
    time: dateDecoder,
  }),
  D.intersect(threadEventDecoder),
);

export type IncomingThreadEvent = D.TypeOf<typeof incomingThreadEventDecoder>;
