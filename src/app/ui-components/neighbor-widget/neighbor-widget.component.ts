import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
} from '@angular/core';
import { NgClass } from '@angular/common';
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
  imports: [ ButtonIconComponent, ButtonComponent, NgClass ]
})
export class NeighborWidgetComponent implements OnChanges {
  @Input() navigationMode?: NavigationMode;

  @Output() parent = new EventEmitter<void>();
  @Output() left = new EventEmitter<void>();
  @Output() right = new EventEmitter<void>();

  /** Deferred until prev/next leave animation finishes. */
  showBackCaptionDelayed = false;
  hideParentSeparatorDelayed = false;

  private lastAppliedMode?: NavigationMode;
  private prevNextWasVisible = false;
  private pendingPrevNextLeaveLayout = false;

  ngOnChanges(changes: SimpleChanges): void {
    if (!changes['navigationMode']) return;
    const mode = this.navigationMode;
    if (!mode || !this.navigationModeChanged(mode)) return;
    this.syncBackButtonLayout(mode);
    this.lastAppliedMode = { parent: mode.parent, left: mode.left, right: mode.right };
  }

  showPrevNextNav(): boolean {
    return !!(this.navigationMode?.left || this.navigationMode?.right);
  }

  showBackCaption(): boolean {
    return this.showBackCaptionDelayed;
  }

  hideParentSeparator(): boolean {
    return this.hideParentSeparatorDelayed;
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
      this.showBackCaptionDelayed = !mode.right;
      this.hideParentSeparatorDelayed = false;
    } else if (this.prevNextWasVisible) {
      this.pendingPrevNextLeaveLayout = true;
      this.showBackCaptionDelayed = false;
      this.hideParentSeparatorDelayed = false;
    } else {
      this.pendingPrevNextLeaveLayout = false;
      this.showBackCaptionDelayed = !mode.right;
      this.hideParentSeparatorDelayed = true;
    }

    this.prevNextWasVisible = prevNextVisible;
  }

  private completePrevNextLeaveLayout(): void {
    if (!this.pendingPrevNextLeaveLayout) return;
    const mode = this.navigationMode;
    if (!mode || mode.left || mode.right) return;

    this.pendingPrevNextLeaveLayout = false;
    this.showBackCaptionDelayed = !mode.right;
    this.hideParentSeparatorDelayed = true;
  }
}
