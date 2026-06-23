import { Component, inject } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { RouterLink } from '@angular/router';
import { APPCONFIG } from 'src/app/config';

@Component({
  selector: 'alg-platform-logo',
  templateUrl: './platform-logo.component.html',
  styleUrl: './platform-logo.component.scss',
  imports: [ RouterLink ],
})
export class PlatformLogoComponent {
  private titleService = inject(Title);

  title = this.titleService.getTitle();
  leftHeaderLogoUrl = inject(APPCONFIG).leftHeaderLogoUrl;
}
