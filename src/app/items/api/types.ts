/** Types and decoders for types used in platform-task communication */
import * as D from 'io-ts/Decoder';
import * as z from 'zod';

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
export const taskViewSchema = z.object({
  requires: z.string(),
  includes: z.array(z.string()),
}).partial();
export type TaskView = z.infer<typeof taskViewSchema>;

export const taskViewsSchema = z.record(taskViewSchema);
export type TaskViews = z.infer<typeof taskViewsSchema>;

// Task grading results
export interface RawTaskGrade {
  score?: unknown,
  message?: unknown,
  scoreToken?: unknown,
}
export const taskGradeSchema = z.object({
  score: z.number(),
  message: z.string(),
  scoreToken: z.string().nullable(),
}).partial();
export type TaskGrade = z.infer<typeof taskGradeSchema>;
export type TaskScore = NonNullable<TaskGrade['score']>;
export type TaskScoreToken = NonNullable<TaskGrade['scoreToken']>;

// Parameters sent by the task to platform.updateDisplay
export const updateDisplayParamsSchema = z.object({
  height: z.number(),
  views: taskViewsSchema,
  scrollTop: z.number(),
}).partial();
export type UpdateDisplayParams = z.infer<typeof updateDisplayParamsSchema>;

// Log data sent by the task
export const taskLogSchema = z.array(z.unknown());
export type TaskLog = z.infer<typeof taskLogSchema>;

export const taskMetadataSchema = z.object({
  autoHeight: z.boolean(),
  disablePlatformProgress: z.boolean(),
  editorUrl: z.string(),
  usesRandomSeed: z.boolean(),
  usesTokens: z.boolean(),
}).partial();
export type TaskMetaData = z.infer<typeof taskMetadataSchema>;
export type TaskResources = unknown;

export const openUrlParamsSchema = z.union([
  z.string(),
  z.union([
    z.object({ path: z.string() }),
    z.object({ url: z.string() }),
    z.object({ itemId: z.string() }),
    z.object({ textId: z.string() }),
  ]).and(z.object({ newTab: z.boolean().optional() }))
]);

export type OpenUrlParams = z.infer<typeof openUrlParamsSchema>;
