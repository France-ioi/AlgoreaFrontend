import { Component, EventEmitter, Output } from '@angular/core';

@Component({
  selector: 'alg-left-menu',
  templateUrl: './left-menu.component.html',
  styleUrls: [ './left-menu.component.scss' ]
})
export class LeftMenuComponent {

  @Output() hideLeftMenu = new EventEmitter<void>();

  isNavThemeDark = false;

  toggleDisplay(shown: boolean): void {
    if (!shown) this.hideLeftMenu.emit();
  }

  onNavThemeChange(event: string | null): void {
    this.isNavThemeDark = event === 'dark';
  }

}
