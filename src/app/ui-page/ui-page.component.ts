import { Component } from '@angular/core';
import { ButtonComponent } from 'src/app/ui-components/button/button.component';
import { ButtonIconComponent } from 'src/app/ui-components/button-icon/button-icon.component';

@Component({
  selector: 'alg-ui-page',
  templateUrl: './ui-page.component.html',
  styleUrls: [ './ui-page.component.scss' ],
  standalone: true,
  imports: [
    ButtonComponent,
    ButtonIconComponent
  ]
})
export class UiPageComponent {}
