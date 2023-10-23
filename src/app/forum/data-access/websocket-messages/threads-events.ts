import * as D from 'io-ts/Decoder';
import { pipe } from 'fp-ts/function';

export const attemptStartedEventDecoder = D.struct({
  label: D.literal('result_started'),
  data: D.struct({
    attemptId: D.string,
  }),
});

export const submissionEventDecoder = D.struct({
  label: D.literal('submission'),
  data: pipe(
    D.struct({
      attemptId: D.string,
      answerId: D.string,
    }),
    D.intersect(D.partial({
      score: D.number,
    })),
  )
});

export const messageEventDecoder = D.struct({
  label: D.literal('message'),
  data: D.struct({
    content: D.string,
  }),
});

export const threadEventDecoder = D.union(
  attemptStartedEventDecoder,
  submissionEventDecoder,
  messageEventDecoder,
);

export type ThreadEvent = D.TypeOf<typeof threadEventDecoder>;

export function messageEvent(message: string): ThreadEvent {
  return { label: 'message', data: { content: message } };
}
