import { Component, inject, Input } from '@angular/core';
import { User } from 'src/app/groups/models/user';
import { GenerateProfileEditTokenService } from 'src/app/groups/data-access/generate-profile-edit-token.service';
import { Location } from '@angular/common';
import { APPCONFIG } from 'src/app/app.config';
import { HttpParams } from '@angular/common/http';
import { ButtonComponent } from 'src/app/ui-components/button/button.component';

@Component({
  selector: 'alg-user-info',
  templateUrl: './user-info.component.html',
  styleUrls: [ './user-info.component.scss' ],
  standalone: true,
  imports: [
    ButtonComponent,
  ]
})
export class UserInfoComponent {
  private config = inject(APPCONFIG);
  @Input({ required: true }) user!: User;

  constructor(
    private generateProfileEditTokenService: GenerateProfileEditTokenService,
    private location: Location,
  ) {}

  onModifyPassword(): void {
    this.generateProfileEditTokenService.generate(this.user.groupId).subscribe(response => {
      const backUrl = window.location.origin + this.location.prepareExternalUrl('update-profile.html');
      const params = new HttpParams({
        fromObject: {
          client_id: this.config.oauthClientId,
          return_url: encodeURI(backUrl),
          token: response.token,
          alg: response.alg,
        },
      }).toString();
      window.open(
        `${ this.config.oauthServerUrl }/group_admin/password?${ params }`,
        undefined,
        'popup,width=800,height=640'
      );
    });
  }
}
