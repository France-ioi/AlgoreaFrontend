import { Component, ChangeDetectionStrategy, input, computed, signal } from '@angular/core';
import { ScoreDistributionEntry } from '../../data-access/get-task-stats.service';

const TIME_BUCKET_KEYS = [ 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60 ];
// Include t=0 to anchor the chart to the moment users start working (bucket 0 = 100%, others = 0%).
const PATH_TIMES = [ 0, ...TIME_BUCKET_KEYS ];
// Lower bound of each score bucket: 0 = "started, score < 10", 10 = "score in [10, 20)", ..., 100 = "score = 100".
const SCORE_BUCKETS = [ 0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100 ];

const X_TICKS = [ 0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60 ];
const Y_TICKS = [ 0, 20, 40, 60, 80, 100 ];

const MARGIN = { top: 16, right: 16, bottom: 40, left: 50 };
const SVG_WIDTH = 700;
const SVG_HEIGHT = 380;
const PLOT_W = SVG_WIDTH - MARGIN.left - MARGIN.right;
const PLOT_H = SVG_HEIGHT - MARGIN.top - MARGIN.bottom;
const MAX_MINUTES = 60;
const MAX_PCT = 100;

interface ChartArea {
  bucket: number,
  label: string,
  color: string,
  pathD: string,
}

interface TooltipBucket {
  bucket: number,
  label: string,
  pct: number,
  color: string,
  yTop: number,
}

interface TooltipData {
  time: number,
  x: number,
  buckets: TooltipBucket[],
}

function bucketLabel(bucket: number): string {
  return bucket === 100 ? '100' : `${bucket}-${bucket + 10}`;
}

function bucketColor(bucket: number): string {
  // Single continuous blue->green gradient across all 11 buckets (0, 10, ..., 100).
  // Lightness drops from 55% to 38% so the high-score end reads as a richer, less washed-out green.
  const t = bucket / 100;
  const hue = 220 - t * 80;
  const sat = 70 - t * 10;
  const lightness = 55 - t * 17;
  return `hsl(${hue.toFixed(0)}, ${sat.toFixed(0)}%, ${lightness.toFixed(0)}%)`;
}

function xPos(minutes: number): number {
  return MARGIN.left + (minutes / MAX_MINUTES) * PLOT_W;
}

function yPos(pct: number): number {
  return MARGIN.top + (1 - pct / MAX_PCT) * PLOT_H;
}

// Cumulative % from the bottom of the stack up to (and not including) `bucket`.
// Equivalent to: 100% - (% of users with score >= bucket).
function cumulativeBottomOf(bucket: number, pctByThreshold: Record<number, number>): number {
  if (bucket === 0) return 0;
  return 100 - (pctByThreshold[bucket] ?? 0);
}

function pctsAtTime(t: number, sortedEntries: ScoreDistributionEntry[]): Record<number, number> {
  // At t=0 nobody has scored yet, so every "score >= X" curve is 0% (=> bucket 0 fills the whole stack).
  if (t === 0) return Object.fromEntries(sortedEntries.map(e => [ e.score, 0 ]));
  const tStr = t.toString();
  return Object.fromEntries(sortedEntries.map(e => [ e.score, e.pctByTime[tStr] ?? 0 ]));
}

@Component({
  selector: 'alg-score-over-time-chart',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './score-over-time-chart.component.html',
  styleUrls: [ './score-over-time-chart.component.scss' ],
})
export class ScoreOverTimeChartComponent {
  readonly entries = input.required<ScoreDistributionEntry[]>();

  readonly svgWidth = SVG_WIDTH;
  readonly svgHeight = SVG_HEIGHT;
  readonly margin = MARGIN;
  readonly plotW = PLOT_W;
  readonly plotH = PLOT_H;
  readonly xTicks = X_TICKS;
  readonly yTicks = Y_TICKS;

  readonly xPos = xPos;
  readonly yPos = yPos;

  readonly hoveredTime = signal<number | null>(null);

  private readonly sortedEntries = computed<ScoreDistributionEntry[]>(
    () => [ ...this.entries() ].sort((a, b) => a.score - b.score),
  );

  readonly areas = computed<ChartArea[]>(() => {
    const sorted = this.sortedEntries();
    // Cumulative bottom of each bucket (in % space, 0 = bottom of plot, 100 = top), indexed by PATH_TIMES position.
    const bottoms = new Map<number, number[]>();
    for (const bucket of SCORE_BUCKETS) {
      bottoms.set(bucket, PATH_TIMES.map(t => cumulativeBottomOf(bucket, pctsAtTime(t, sorted))));
    }
    const fullTop = PATH_TIMES.map(() => 100);

    return SCORE_BUCKETS.map(bucket => {
      // The top of band `bucket` is the bottom of the next band; the topmost band reaches 100%.
      const topCurve = bucket === 100 ? fullTop : (bottoms.get(bucket + 10) ?? fullTop);
      const bottomCurve = bottoms.get(bucket) ?? fullTop;

      const topPath = PATH_TIMES.map((t, i) => `${xPos(t)},${yPos(topCurve[i] ?? 0)}`).join(' L');
      const bottomPath = PATH_TIMES.map((t, i) => ({ t, i }))
        .reverse()
        .map(({ t, i }) => `${xPos(t)},${yPos(bottomCurve[i] ?? 0)}`)
        .join(' L');

      return {
        bucket,
        label: bucketLabel(bucket),
        color: bucketColor(bucket),
        pathD: `M${topPath} L${bottomPath} Z`,
      };
    });
  });

  readonly tooltip = computed<TooltipData | null>(() => {
    const t = this.hoveredTime();
    if (t === null) return null;
    const sorted = this.sortedEntries();
    const pcts = pctsAtTime(t, sorted);

    // Tooltip rows are listed top-to-bottom in the visual stack (highest score first).
    const buckets: TooltipBucket[] = SCORE_BUCKETS.slice().reverse().map(bucket => {
      const bottom = cumulativeBottomOf(bucket, pcts);
      const top = bucket === 100 ? 100 : cumulativeBottomOf(bucket + 10, pcts);
      return {
        bucket,
        label: bucketLabel(bucket),
        pct: Math.max(0, top - bottom),
        color: bucketColor(bucket),
        yTop: yPos(top),
      };
    });

    return { time: t, x: xPos(t), buckets };
  });

  onMouseMove(event: MouseEvent): void {
    const target = event.currentTarget as SVGGraphicsElement;
    const svgEl = target.ownerSVGElement;
    const ctm = target.getScreenCTM();
    if (!svgEl || !ctm) return;
    // Use SVG's coordinate transformation so the mouse position maps to viewBox units regardless of CSS scaling.
    const pt = svgEl.createSVGPoint();
    pt.x = event.clientX;
    pt.y = event.clientY;
    const transformed = pt.matrixTransform(ctm.inverse());
    const minutes = ((transformed.x - MARGIN.left) / PLOT_W) * MAX_MINUTES;

    const nearest = TIME_BUCKET_KEYS.reduce(
      (best, tk) => (Math.abs(tk - minutes) < Math.abs(best - minutes) ? tk : best),
      TIME_BUCKET_KEYS[0] ?? 0,
    );
    this.hoveredTime.set(nearest);
  }

  onMouseLeave(): void {
    this.hoveredTime.set(null);
  }
}
