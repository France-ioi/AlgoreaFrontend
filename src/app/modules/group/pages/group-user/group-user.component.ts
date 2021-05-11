import { Component } from '@angular/core';
import { UserView, UserViewService } from '../../services/user-view.service';
import { mapToFetchState } from '../../../../shared/operators/state';
import { Observable } from 'rxjs';
import { ActivatedRoute } from '@angular/router';
import { switchMap } from 'rxjs/operators';

@Component({
  selector: 'alg-group-user',
  templateUrl: './group-user.component.html',
  styleUrls: [ './group-user.component.scss' ]
})
export class GroupUserComponent {
  readonly state$ = this.route.params.pipe(
    switchMap(({ id }) => this.getUser$(id)),
    mapToFetchState()
  );

  constructor(private route: ActivatedRoute, private userView: UserViewService) { }

  getUser$(id: string): Observable<UserView> {
    return this.userView.getForId(id);
  }
}
