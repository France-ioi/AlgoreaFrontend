import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  effect,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { ButtonIconComponent } from 'src/app/ui-components/button-icon/button-icon.component';
import { ButtonComponent } from 'src/app/ui-components/button/button.component';

interface NavigationMode {
  parent: boolean,
  left: boolean,
  right: boolean,
}

/** Matches `.neighbor-prev-next-leave` duration (0.4s); fallback if `animationend` does not fire. */
const PREV_NEXT_LEAVE_MS = 400;

@Component({
  selector: 'alg-neighbor-widget',
  templateUrl: './neighbor-widget.component.html',
  styleUrls: [ 'neighbor-widget.component.scss' ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ ButtonIconComponent, ButtonComponent ],
})
export class NeighborWidgetComponent {
  private readonly destroyRef = inject(DestroyRef);

  navigationMode = input<NavigationMode>();

  parent = output<void>();
  left = output<void>();
  right = output<void>();

  showBackCaptionDelayed = signal(false);
  hideParentSeparatorDelayed = signal(false);

  showPrevNextNav = computed(() => {
    const mode = this.navigationMode();
    return !!(mode?.left || mode?.right);
  });

  private lastAppliedMode?: NavigationMode;
  private prevNextWasVisible = false;
  private pendingPrevNextLeaveLayout = false;
  private prevNextLeaveTimer?: ReturnType<typeof setTimeout>;

  constructor() {
    this.destroyRef.onDestroy(() => this.clearPrevNextLeaveTimer());

    effect(() => {
      const mode = this.navigationMode();
      if (!mode || !this.navigationModeChanged(mode)) return;
      this.syncBackButtonLayout(mode);
      this.lastAppliedMode = { parent: mode.parent, left: mode.left, right: mode.right };
    }, { allowSignalWrites: true });
  }

  onPrevNextPanelAnimationEnd(event: AnimationEvent): void {
    // `animationend` bubbles up from child animations (e.g. the button caption trigger), whose
    // events may not carry an `animationName`. Ignore anything that isn't the panel leave animation.
    if (!event.animationName?.startsWith('neighbor-prev-next-leave')) return;
    this.clearPrevNextLeaveTimer();
    this.completePrevNextLeaveLayout();
  }

  private navigationModeChanged(mode: NavigationMode): boolean {
    if (!this.lastAppliedMode) return true;
    return this.lastAppliedMode.parent !== mode.parent
      || this.lastAppliedMode.left !== mode.left
      || this.lastAppliedMode.right !== mode.right;
  }

  private syncBackButtonLayout(mode: NavigationMode): void {
    const prevNextVisible = mode.left || mode.right;

    if (prevNextVisible) {
      this.clearPrevNextLeaveTimer();
      this.pendingPrevNextLeaveLayout = false;
      this.showBackCaptionDelayed.set(!mode.right);
      this.hideParentSeparatorDelayed.set(false);
    } else if (this.prevNextWasVisible) {
      this.pendingPrevNextLeaveLayout = true;
      this.showBackCaptionDelayed.set(false);
      this.hideParentSeparatorDelayed.set(false);
      this.schedulePrevNextLeaveCompletion();
    } else {
      this.clearPrevNextLeaveTimer();
      this.pendingPrevNextLeaveLayout = false;
      this.applyBackOnlyLayout(mode);
    }

    this.prevNextWasVisible = prevNextVisible;
  }

  private schedulePrevNextLeaveCompletion(): void {
    this.clearPrevNextLeaveTimer();
    this.prevNextLeaveTimer = setTimeout(() => {
      this.prevNextLeaveTimer = undefined;
      this.completePrevNextLeaveLayout();
    }, PREV_NEXT_LEAVE_MS);
  }

  private completePrevNextLeaveLayout(): void {
    if (!this.pendingPrevNextLeaveLayout) return;
    const mode = this.navigationMode();
    if (!mode || mode.left || mode.right) return;

    this.pendingPrevNextLeaveLayout = false;
    this.applyBackOnlyLayout(mode);
  }

  private applyBackOnlyLayout(mode: NavigationMode): void {
    this.showBackCaptionDelayed.set(!mode.right);
    this.hideParentSeparatorDelayed.set(true);
  }

  private clearPrevNextLeaveTimer(): void {
    if (this.prevNextLeaveTimer) {
      clearTimeout(this.prevNextLeaveTimer);
      this.prevNextLeaveTimer = undefined;
    }
  }
}
