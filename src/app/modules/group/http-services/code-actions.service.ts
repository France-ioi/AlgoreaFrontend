import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { SimpleActionResponse, assertSuccess } from 'src/app/shared/http-services/action-response';
import { environment } from 'src/environments/environment';
import { map } from 'rxjs/operators';

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
      .post<NewCodeSuccessResponse|SimpleActionResponse>(`${environment.apiUrl}/groups/${id}/code`, null, {})
      .pipe(
        map(resp => {
          const code = (resp as NewCodeSuccessResponse).code;
          if (!code) throw new Error('The backend has returned an error (no code)');
          return code;
        })
      );
  }

  removeCode(id: string): Observable<void> {
    return this.http
      .delete<SimpleActionResponse>(`${environment.apiUrl}/groups/${id}/code`)
      .pipe(
        map(assertSuccess),
      );
  }

}
