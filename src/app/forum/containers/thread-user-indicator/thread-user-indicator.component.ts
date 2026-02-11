import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { FetchState } from 'src/app/utils/state';
import { SwitchComponent } from 'src/app/ui-components/switch/switch.component';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'alg-thread-user-indicator',
  templateUrl: './thread-user-indicator.component.html',
  styleUrls: [ './thread-user-indicator.component.scss' ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    SwitchComponent,
    FormsModule,
  ],
})
export class ThreadUserIndicatorComponent {
  followStatus = input.required<FetchState<boolean>>();
  isThreadOpen = input.required<boolean>();

  followChanged = output<boolean>();

  onFollowChange(follow: boolean): void {
    this.followChanged.emit(follow);
  }
}
