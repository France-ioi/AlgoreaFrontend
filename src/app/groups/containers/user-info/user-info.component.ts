import { Component, inject, input, output } from '@angular/core';
import { CanEditPersonalInfoPipe, CanViewPersonalInfoPipe, User } from 'src/app/groups/models/user';
import { GenerateProfileEditTokenService } from 'src/app/groups/data-access/generate-profile-edit-token.service';
import { Location } from '@angular/common';
import { APPCONFIG } from 'src/app/config';
import { HttpParams } from '@angular/common/http';
import { ButtonComponent } from 'src/app/ui-components/button/button.component';
import { UserGroupsWithGrantsComponent } from '../user-groups-with-grants/user-groups-with-grants.component';

@Component({
  selector: 'alg-user-info',
  templateUrl: './user-info.component.html',
  styleUrls: [ './user-info.component.scss' ],
  imports: [
    ButtonComponent,
    UserGroupsWithGrantsComponent,
    CanEditPersonalInfoPipe,
    CanViewPersonalInfoPipe,
  ]
})
export class UserInfoComponent {
  private generateProfileEditTokenService = inject(GenerateProfileEditTokenService);
  private location = inject(Location);

  user = input.required<User>();
  hasChanged = output();

  private config = inject(APPCONFIG);

  onModifyPassword(): void {
    this.generateProfileEditTokenService.generate(this.user().groupId).subscribe(response => {
      const params = new HttpParams({
        fromObject: {
          client_id: this.config.oauthClientId,
          return_url: encodeURI(this.callbackUrl()),
          token: response.token,
          alg: response.alg,
        },
      });
      this.openPopup(`/group_admin/password?${ params.toString() }`);
    });
  }

  onModifyProfile(): void {
    const params = new HttpParams({
      fromObject: {
        all: 1,
        client_id: this.config.oauthClientId,
        redirect_uri: encodeURI(this.callbackUrl()),
      },
    });
    this.openPopup(`?${ params.toString() }`);

    const onProfileUpdated = (): void => {
      window.removeEventListener('profileUpdated', onProfileUpdated);
      this.hasChanged.emit();
    };

    window.addEventListener('profileUpdated', onProfileUpdated);
  }

  private openPopup(path: string): void {
    window.open(`${ this.config.oauthServerUrl }${ path }`, undefined, 'popup,width=800,height=640');
  }

  private callbackUrl(): string {
    return window.location.origin + this.location.prepareExternalUrl('update-profile.html');
  }

}
