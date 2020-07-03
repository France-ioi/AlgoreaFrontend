import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { GenericActionResponse, throwErrorOnFailure } from 'src/app/shared/http-services/action-response';
import { environment } from 'src/environments/environment';
import { tap, map } from 'rxjs/operators';

export interface NewCodeSuccessResponse {
  code: string
}

@Injectable({
  providedIn: 'root'
})
export class CodeActionsService {

  constructor(private http: HttpClient) {}

  createNewCode(id: string): Observable<string> {
    return this.http
      .post<NewCodeSuccessResponse|GenericActionResponse>(`${environment.apiUrl}/groups/${id}/code`, null, {})
      .pipe(
        tap((r) => {
          if (!(r as NewCodeSuccessResponse).code) throw new Error('Server has returned an error (no code)');
        }),
        map( (r:NewCodeSuccessResponse) => r.code),
      );
  }

  removeCode(id: string): Observable<void> {
    return this.http
      .delete<GenericActionResponse>(`${environment.apiUrl}/groups/${id}/code`)
      .pipe(
        tap(throwErrorOnFailure),
        map( (_r) => {}),
      );
  }

}
