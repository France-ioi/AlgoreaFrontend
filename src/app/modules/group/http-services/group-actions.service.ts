import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { GenericActionResponse, throwErrorOnFailure } from 'src/app/shared/http-services/action-response';
import { environment } from 'src/environments/environment';
import { tap, map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class GroupActionsService {

  constructor(private http: HttpClient) {}

  updateGroup(id: string, changes: object): Observable<void> {
    return this.http
      .put<GenericActionResponse>(`${environment.apiUrl}/groups/${id}`, changes)
      .pipe(
        tap(throwErrorOnFailure),
        map( (_r) => {})
      );
  }

}
