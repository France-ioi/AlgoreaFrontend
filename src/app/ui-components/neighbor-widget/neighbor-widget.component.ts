import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
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

@Component({
  selector: 'alg-neighbor-widget',
  templateUrl: './neighbor-widget.component.html',
  styleUrls: [ 'neighbor-widget.component.scss' ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ ButtonIconComponent, ButtonComponent ],
})
export class NeighborWidgetComponent {
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

  constructor() {
    effect(() => {
      const mode = this.navigationMode();
      if (!mode || !this.navigationModeChanged(mode)) return;
      this.syncBackButtonLayout(mode);
      this.lastAppliedMode = { parent: mode.parent, left: mode.left, right: mode.right };
    });
  }

  onPrevNextPanelAnimationEnd(event: AnimationEvent): void {
    if (!event.animationName.startsWith('neighbor-prev-next-leave')) return;
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
      this.pendingPrevNextLeaveLayout = false;
      this.showBackCaptionDelayed.set(!mode.right);
      this.hideParentSeparatorDelayed.set(false);
    } else if (this.prevNextWasVisible) {
      this.pendingPrevNextLeaveLayout = true;
      this.showBackCaptionDelayed.set(false);
      this.hideParentSeparatorDelayed.set(false);
    } else {
      this.pendingPrevNextLeaveLayout = false;
      this.showBackCaptionDelayed.set(!mode.right);
      this.hideParentSeparatorDelayed.set(true);
    }

    this.prevNextWasVisible = prevNextVisible;
  }

  private completePrevNextLeaveLayout(): void {
    if (!this.pendingPrevNextLeaveLayout) return;
    const mode = this.navigationMode();
    if (!mode || mode.left || mode.right) return;

    this.pendingPrevNextLeaveLayout = false;
    this.showBackCaptionDelayed.set(!mode.right);
    this.hideParentSeparatorDelayed.set(true);
  }
}
