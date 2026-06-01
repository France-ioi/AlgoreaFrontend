import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  Output,
  SimpleChanges,
} from '@angular/core';
import { NgClass } from '@angular/common';
import { ButtonIconComponent } from 'src/app/ui-components/button-icon/button-icon.component';
import { ButtonComponent } from 'src/app/ui-components/button/button.component';

/** Matches neighbor-prev-next-leave duration (0.2s delay + 0.2s animation). */
const PREV_NEXT_LEAVE_MS = 400;

@Component({
  selector: 'alg-neighbor-widget',
  templateUrl: './neighbor-widget.component.html',
  styleUrls: [ 'neighbor-widget.component.scss' ],
  imports: [ ButtonIconComponent, ButtonComponent, NgClass ]
})
export class NeighborWidgetComponent implements OnChanges, OnDestroy {
  @Input() navigationMode?: {parent: boolean, left: boolean, right: boolean};

  @Output() parent = new EventEmitter<void>();
  @Output() left = new EventEmitter<void>();
  @Output() right = new EventEmitter<void>();

  /** Deferred until prev/next leave animation finishes. */
  showBackCaptionDelayed = false;
  hideParentSeparatorDelayed = false;

  private prevNextLeaveTimer?: ReturnType<typeof setTimeout>;
  private prevNextWasVisible = false;

  ngOnChanges(changes: SimpleChanges): void {
    if (!changes['navigationMode']) return;
    this.syncBackButtonLayout();
  }

  ngOnDestroy(): void {
    this.clearPrevNextLeaveTimer();
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

  private syncBackButtonLayout(): void {
    const mode = this.navigationMode;
    if (!mode) return;

    const prevNextVisible = this.showPrevNextNav();

    if (prevNextVisible) {
      this.clearPrevNextLeaveTimer();
      this.showBackCaptionDelayed = !mode.right;
      this.hideParentSeparatorDelayed = false;
    } else if (this.prevNextWasVisible) {
      this.clearPrevNextLeaveTimer();
      this.showBackCaptionDelayed = false;
      this.hideParentSeparatorDelayed = false;
      this.prevNextLeaveTimer = setTimeout(() => {
        this.showBackCaptionDelayed = !mode.right;
        this.hideParentSeparatorDelayed = true;
        this.prevNextLeaveTimer = undefined;
      }, PREV_NEXT_LEAVE_MS);
    } else {
      this.showBackCaptionDelayed = !mode.right;
      this.hideParentSeparatorDelayed = true;
    }

    this.prevNextWasVisible = prevNextVisible;
  }

  private clearPrevNextLeaveTimer(): void {
    if (this.prevNextLeaveTimer) {
      clearTimeout(this.prevNextLeaveTimer);
      this.prevNextLeaveTimer = undefined;
    }
  }
}
