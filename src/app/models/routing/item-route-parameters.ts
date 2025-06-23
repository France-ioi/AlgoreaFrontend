import { ItemRoute } from './item-route';
import { encodePath, parsePath } from './path-parameter';

type RouteParameters = Partial<Pick<ItemRoute, 'path'|'attemptId'|'parentAttemptId'|'answer'|'observedGroup'>>;

enum ParamNames {
  Path = 'p',
  AttemptId = 'a',
  ParentAttemptId = 'pa',
  AnswerId = 'answerId',
  AnswerBest = 'answerBest',
  AnswerBestParticipantId = 'answerParticipantId',
  ObservedGroupId = 'og',
  ObservedGroupIsUser = 'ou',
}

type ItemUrlParams = Partial<{ [name in ParamNames]: string }>;

export function extractItemRouteParameters(parameters: ItemUrlParams): RouteParameters {
  const pathString = parameters[ParamNames.Path];
  const path = pathString !== undefined ? parsePath(pathString) : undefined;
  const attemptId = parameters[ParamNames.AttemptId];
  const parentAttemptId = parameters[ParamNames.ParentAttemptId];
  const answerId = parameters[ParamNames.AnswerId];
  const answerBest = parameters[ParamNames.AnswerBest] !== undefined ? true : undefined;
  const answerBestParticipantId = parameters[ParamNames.AnswerBestParticipantId];
  const answer = answerId ? { id: answerId } : (answerBest ? { best: { id: answerBestParticipantId } } : undefined);
  const observedGroupId = parameters[ParamNames.ObservedGroupId];
  const observedGroupIsUser = parameters[ParamNames.ObservedGroupIsUser];
  const observedGroup = observedGroupId ? { id: observedGroupId, isUser: observedGroupIsUser === '1' } : undefined;
  return { path, attemptId, parentAttemptId, answer, observedGroup };
}

export function encodeItemRouteParameters(p: RouteParameters): ItemUrlParams {
  const params: { [name: string]: string } = {};
  if (p.path) params[ParamNames.Path] = encodePath(p.path);
  if (p.attemptId) params[ParamNames.AttemptId] = p.attemptId;
  if (p.parentAttemptId) params[ParamNames.ParentAttemptId] = p.parentAttemptId;
  if (p.answer?.id) params[ParamNames.AnswerId] = p.answer.id;
  if (p.answer?.best) params[ParamNames.AnswerBest] = '1';
  if (p.answer?.best?.id) params[ParamNames.AnswerBestParticipantId] = p.answer.best.id;
  if (p.observedGroup?.id) params[ParamNames.ObservedGroupId] = p.observedGroup.id;
  if (p.observedGroup?.isUser) params[ParamNames.ObservedGroupIsUser] = '1';
  return params;
}
