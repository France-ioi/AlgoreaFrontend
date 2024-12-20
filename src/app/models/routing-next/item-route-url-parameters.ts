import { AnswerId, AttemptId, ItemPath, ParticipantId } from '../ids';
import { encodePath, parsePath } from '../routing/path-parameter';

enum ParamNames {
  Path = 'p',
  AttemptId = 'a',
  ParentAttemptId = 'pa',
  AnswerId = 'answerId',
  AnswerBest = 'answerBest',
  AnswerBestParticipantId = 'answerParticipantId'
}

type ItemUrlParams = Partial<{ [name in ParamNames]: string }>;

interface ParsedParameters {
  path?: ItemPath,
  attemptId?: AttemptId,
  parentAttemptId?: AttemptId,
  answerId?: AnswerId,
  answerBest?: boolean,
  answerBestParticipantId?: ParticipantId,
}

export function extractItemRouteParameters(parameters: ItemUrlParams): ParsedParameters {
  const pathString = parameters[ParamNames.Path];
  const path = pathString ? parsePath(pathString) : undefined;
  const attemptId = parameters[ParamNames.AttemptId];
  const parentAttemptId = parameters[ParamNames.ParentAttemptId];
  const answerId = parameters[ParamNames.AnswerId];
  const answerBest = parameters[ParamNames.AnswerBest] !== undefined ? true : undefined;
  const answerBestParticipantId = parameters[ParamNames.AnswerBestParticipantId];
  return { path, attemptId, parentAttemptId, answerId, answerBest, answerBestParticipantId };
}

export function encodeItemRouteParameters(p: ParsedParameters): ItemUrlParams {
  const params: { [name: string]: string } = {};
  if (p.path) params[ParamNames.Path] = encodePath(p.path);
  if (p.attemptId) params[ParamNames.AttemptId] = p.attemptId;
  if (p.parentAttemptId) params[ParamNames.ParentAttemptId] = p.parentAttemptId;
  if (p.answerId) params[ParamNames.AnswerId] = p.answerId;
  if (p.answerBest) params[ParamNames.AnswerBest] = '1';
  if (p.answerBestParticipantId) params[ParamNames.AnswerBestParticipantId] = p.answerBestParticipantId;

  return params;
}
