import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { FetchState } from 'src/app/utils/state';
import { SwitchComponent } from 'src/app/ui-components/switch/switch.component';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'alg-thread-top-indicator',
  templateUrl: './thread-top-indicator.component.html',
  styleUrls: [ './thread-top-indicator.component.scss' ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    SwitchComponent,
    FormsModule,
  ],
})
export class ThreadTopIndicatorComponent {
  followStatus = input.required<FetchState<boolean>>();
  isThreadOpen = input.required<boolean>();

  followChanged = output<boolean>();

  onFollowChange(follow: boolean): void {
    this.followChanged.emit(follow);
  }
}
