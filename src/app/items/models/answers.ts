import { Answer as GetAnswerType } from 'src/app/items/data-access/get-answer.service';

export type Answer =
  Pick<GetAnswerType, 'id' | 'authorId' | 'answer' | 'state' | 'score' | 'itemId' | 'participantId'>
  & Partial<Pick<GetAnswerType, 'createdAt'>>;

type StateAnswer = Pick<Answer, 'answer'|'state'>;

export function areStateAnswerEqual(x: StateAnswer, y: StateAnswer): boolean {
  return (x.answer ?? '') === (y.answer ?? '') && (x.state ?? '') === (y.state ?? '');
}
