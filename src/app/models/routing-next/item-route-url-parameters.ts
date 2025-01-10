import { encodePath, parsePath } from '../routing/path-parameter';
import { ItemRouteParameters } from './item-route';

enum ParamNames {
  Path = 'p',
  AttemptId = 'a',
  ParentAttemptId = 'pa',
  AnswerId = 'answerId',
  AnswerBest = 'answerBest',
  AnswerBestParticipantId = 'answerParticipantId'
}

type ItemUrlParams = Partial<{ [name in ParamNames]: string }>;

export function extractItemRouteParameters(parameters: ItemUrlParams): ItemRouteParameters {
  const pathString = parameters[ParamNames.Path];
  const path = pathString ? parsePath(pathString) : undefined;
  const attemptId = parameters[ParamNames.AttemptId];
  const parentAttemptId = parameters[ParamNames.ParentAttemptId];
  const answerId = parameters[ParamNames.AnswerId];
  const answerBest = parameters[ParamNames.AnswerBest] !== undefined ? true : undefined;
  const answerBestParticipantId = parameters[ParamNames.AnswerBestParticipantId];
  const answer = answerId ? { id: answerId } : (answerBest ? { best: { id: answerBestParticipantId } } : undefined);
  return { path, attemptId, parentAttemptId, answer };
}

export function encodeItemRouteParameters(p: ItemRouteParameters): ItemUrlParams {
  const params: { [name: string]: string } = {};
  if (p.path) params[ParamNames.Path] = encodePath(p.path);
  if (p.attemptId) params[ParamNames.AttemptId] = p.attemptId;
  if (p.parentAttemptId) params[ParamNames.ParentAttemptId] = p.parentAttemptId;
  if (p.answer?.id) params[ParamNames.AnswerId] = p.answer.id;
  if (p.answer?.best) params[ParamNames.AnswerBest] = '1';
  if (p.answer?.best?.id) params[ParamNames.AnswerBestParticipantId] = p.answer.best.id;

  return params;
}
