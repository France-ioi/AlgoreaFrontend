import { Component } from '@angular/core';

@Component({
  selector: 'alg-left-menu',
  templateUrl: './left-menu.component.html',
  styleUrls: [ './left-menu.component.scss' ]
})
export class LeftMenuComponent {

  isNavThemeDark = false;

  onNavThemeChange(event: string | null): void {
    this.isNavThemeDark = event === 'dark';
  }

}
