import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { ButtonComponent } from 'src/app/ui-components/button/button.component';

/**
 * Contextual chrome rendered above a destination page that the user navigated
 * to from a recognised "source page" (the source page registered a back-link
 * via `sourcePageActions.registerBackLink`). Shows a heading describing the
 * current context and a button that emits the URL to navigate back to.
 *
 * Stays dumb on purpose: it does no router work itself — the parent receives
 * the URL via `backLinkClick` and decides how to navigate.
 */
@Component({
  selector: 'alg-back-link-bar',
  templateUrl: './back-link-bar.component.html',
  styleUrls: [ './back-link-bar.component.scss' ],
  imports: [ ButtonComponent ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BackLinkBarComponent {
  heading = input.required<string>();
  backLinkLabel = input.required<string>();
  backLinkUrl = input.required<string>();

  backLinkClick = output<string>();

  onClick(): void {
    this.backLinkClick.emit(this.backLinkUrl());
  }
}
