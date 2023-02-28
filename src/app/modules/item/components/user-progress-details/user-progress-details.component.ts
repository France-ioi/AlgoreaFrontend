import { AfterViewInit, SimpleChanges } from '@angular/core';
import { Component, EventEmitter, Input, Output, ViewChild, OnChanges } from '@angular/core';
import { OverlayPanel } from 'primeng/overlaypanel';
import { delay, take } from 'rxjs';
import { TeamUserProgress } from 'src/app/shared/http-services/get-group-progress.service';

export interface ProgressData {
  progress: TeamUserProgress,
  target: Element,
}

@Component({
  selector: 'alg-user-progress-details',
  templateUrl: './user-progress-details.component.html',
  styleUrls: [ './user-progress-details.component.scss' ],
})
export class UserProgressDetailsComponent implements OnChanges, AfterViewInit {

  @Input() progressData?: ProgressData;
  @Input() canEditPermissions?: boolean;

  @Output() editPermissions = new EventEmitter<void>();
  @Output() hide = new EventEmitter<void>();

  @ViewChild('panel') panel?: OverlayPanel;

  progress?: ProgressData['progress'];

  ngAfterViewInit(): void {
    if (this.progressData) this.showOverlay();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.progressData && !changes.progressData.firstChange) {
      this.progress = this.progressData?.progress;
      this.toggleOverlay();
    }
  }

  private toggleOverlay(): void {
    const shouldReopen = this.panel?.overlayVisible && !!this.progressData;
    if (shouldReopen) return this.reopenOverlay();
    this.progressData ? this.showOverlay() : this.hideOverlay();
  }

  private showOverlay(): void {
    setTimeout(() => {
      if (!this.panel) throw new Error('panel not available');
      if (!this.progressData) throw new Error('no progress to render');
      this.panel.show(null, this.progressData.target);
    });
  }

  private hideOverlay(): void {
    if (!this.panel) throw new Error('panel not available');
    this.panel.hide();
  }

  private reopenOverlay(): void {
    if (!this.panel) throw new Error('no panel available');
    this.panel.onHide.pipe(delay(0), take(1)).subscribe(() => this.showOverlay());
    this.hideOverlay();
  }

}
