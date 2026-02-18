import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { LoadingComponent } from 'src/app/ui-components/loading/loading.component';
import { ErrorComponent } from 'src/app/ui-components/error/error.component';
import { ButtonComponent } from 'src/app/ui-components/button/button.component';

export type SingleThreadState = 'fetching' | 'error' | 'not-started-can-start' | 'started' | 'not-started-cannot-start';

@Component({
  selector: 'alg-forum-thread-placeholder',
  templateUrl: './forum-thread-placeholder.component.html',
  styleUrls: [ './forum-thread-placeholder.component.scss' ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    LoadingComponent,
    ErrorComponent,
    ButtonComponent,
  ],
})
export class ForumThreadPlaceholderComponent {
  state = input.required<SingleThreadState>();
  isThreadPanelVisible = input(false);
  isObserving = input(false);

  showThread = output<void>();
  refresh = output<void>();
}
