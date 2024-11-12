import { Answer } from '../data-access/get-answer.service';

type StateAnswer = Pick<Answer, 'answer'|'state'>;

export function areStateAnswerEqual(x: StateAnswer, y: StateAnswer): boolean {
  return (x.answer ?? '') === (y.answer ?? '') && (x.state ?? '') === (y.state ?? '');
}
