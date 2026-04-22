import { Duration } from 'src/app/utils/duration';
import { TaskStats } from '../../data-access/get-task-stats.service';

export function formatDuration(ms: number | null): string {
  if (ms === null) return '—';
  return new Duration(ms).toReadable();
}

export function formatScore(score: number | null): string {
  if (score === null) return '—';
  return score.toFixed(1);
}

export function formatPercent(value: number | null): string {
  if (value === null) return '—';
  return `${Math.round(value)}%`;
}

export function validationRate(stats: TaskStats): number | null {
  const perfect = stats.scoreDistribution.find(e => e.score === 100);
  return perfect ? perfect.pctUsersAbove : null;
}

export type TaskStatsColumnKey = 'users' | 'validation' | 'avgScore' | 'medTime' | 'medValidation' | 'bounceRate';

export interface TaskStatsColumn {
  key: TaskStatsColumnKey,
  shortLabel: string,
  fullLabel: string,
  tooltip: string,
  value: (stats: TaskStats) => string,
}

export const taskStatsColumns: TaskStatsColumn[] = [
  {
    key: 'users',
    shortLabel: $localize`Users`,
    fullLabel: $localize`Users`,
    tooltip: $localize`Number of users for whom resolution statistics have been collected for this task (enabled since April 2026).`,
    value: s => String(s.userCount),
  },
  {
    key: 'validation',
    shortLabel: $localize`Validation`,
    fullLabel: $localize`Validation rate`,
    tooltip: $localize`Percentage of users who validated the task, among those who started it.`,
    value: s => formatPercent(validationRate(s)),
  },
  {
    key: 'avgScore',
    shortLabel: $localize`Avg score`,
    fullLabel: $localize`Average score`,
    tooltip: $localize`Average score across all users who opened this task.`,
    value: s => formatScore(s.avgScore),
  },
  {
    key: 'medTime',
    shortLabel: $localize`Med. time`,
    fullLabel: $localize`Median time spent`,
    tooltip: $localize`Median time spent working on the task, across all users who spent time on it.`,
    value: s => formatDuration(s.medianTimeSpent),
  },
  {
    key: 'medValidation',
    shortLabel: $localize`Med. validation`,
    fullLabel: $localize`Median time to validate`,
    tooltip: $localize`Median time spent before validating this task, across all users who validated it.`,
    value: s => formatDuration(s.medianTimeToValidate),
  },
  {
    key: 'bounceRate',
    shortLabel: $localize`Bounce`,
    fullLabel: $localize`Bounce rate`,
    tooltip: $localize`Percentage of users who opened the task and left without engaging with it.`,
    value: s => formatPercent(s.bounceRate),
  },
];
