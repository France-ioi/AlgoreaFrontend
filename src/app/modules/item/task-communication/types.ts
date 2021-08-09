/** Types and decoders for types used in platform-task communication */

import * as D from 'io-ts/Decoder';


// Parameters passed to the task
// Those need a decoder as a default value to them can be passed by the task
export const taskParamsDecoder = D.struct({
  minScore: D.number,
  maxScore: D.number,
  noScore: D.number,
  randomSeed: D.number,
  readOnly: D.boolean,
  options: D.UnknownRecord,
});
export type TaskParams = D.TypeOf<typeof taskParamsDecoder>;

// Type returned by getTaskParams
export const taskParamsValueDecoder = D.union(taskParamsDecoder, D.UnknownRecord, D.string, D.number, D.boolean);
export type TaskParamsValue = D.TypeOf<typeof taskParamsValueDecoder> | undefined;

// Key default arguments sent to platform.getTaskParams
export const taskParamsKeyDefaultDecoder = D.partial({
  key: D.string,
  defaultValue: taskParamsValueDecoder
});
export type TaskParamsKeyDefault = D.TypeOf<typeof taskParamsKeyDefaultDecoder>;


// Views offered by the task
// For instance, taskViews = { task: { includes: ["editor"] }, solution : {}}
export const taskViewDecoder = D.partial({
  requires: D.string,
  includes: D.array(D.string)
});
export type TaskView = D.TypeOf<typeof taskViewDecoder>;

export const taskViewsDecoder = D.record(taskViewDecoder);
export type TaskViews = D.TypeOf<typeof taskViewsDecoder>;


// Task grading results
export interface RawTaskGrade {
  score?: unknown,
  message?: unknown,
  scoreToken?: unknown
}
export const taskGradeDecoder = D.partial({
  score: D.number,
  message: D.string,
  scoreToken: D.string,
});
export type TaskGrade = D.TypeOf<typeof taskGradeDecoder>;


// Parameters sent by the task to platform.updateDisplay
export const updateDisplayParamsDecoder = D.partial({
  height: D.number,
  views: taskViewsDecoder,
  scrollTop: D.number
});
export type UpdateDisplayParams = D.TypeOf<typeof updateDisplayParamsDecoder>;

// Log data sent by the task
export const taskLogDecoder = D.array(D.string);
export type TaskLog = D.TypeOf<typeof taskLogDecoder>;

// Currently unused
export type TaskMetaData = any;
export type TaskResources = any;
