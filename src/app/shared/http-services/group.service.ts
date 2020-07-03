import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import {
  HttpClient,
  HttpErrorResponse,
} from '@angular/common/http';
import { Observable, throwError, BehaviorSubject } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';

import { Group } from '../models/group.model';
import { NewCodeSuccessResponse } from '../models/group-service-response.model';
import { GenericResponse } from '../models/generic-response.model';

@Injectable({
  providedIn: 'root',
})
export class GroupService {
  private baseGroupUrl = `${environment.apiUrl}/groups`;
  private groupList = new BehaviorSubject<Group>(new Group());

  constructor(private http: HttpClient) {}

  getGroup(id: string): Observable<Group> {
    return this.http
      .get<Group>(`${this.baseGroupUrl}/${id}`)
      .pipe(
        map((group: Group) => {
          const groupObj = new Group(group);
          this.groupList.next(groupObj);
          return groupObj;
        }),
        catchError((e) => this.handleError(e))
      );
  }

  updateGroup(id: string, changes: object): Observable<void> {
    return this.http
      .put<GenericResponse>(`${this.baseGroupUrl}/${id}`, changes)
      .pipe(
        tap((r) => this.ensureSuccessResponse(r)),
        map( (_r) => {}),
        catchError((e) => this.handleError(e))
      );
  }

  getLatestGroup(): Observable<Group> {
    return this.groupList.asObservable();
  }


  /* ****************** */

  createNewCode(id: string): Observable<string> {
    return this.http
      .post<NewCodeSuccessResponse|GenericResponse>(`${this.baseGroupUrl}/${id}/code`, null, {})
      .pipe(
        tap((r) => this.ensureSuccessResponse(r)),
        map( (r:NewCodeSuccessResponse) => r.code),
        catchError((e) => this.handleError(e))
      );
  }

  removeCode(id: string): Observable<void> {
    return this.http
      .delete<GenericResponse>(`${this.baseGroupUrl}/${id}/code`)
      .pipe(
        tap((r) => this.ensureSuccessResponse(r)),
        map( (_r) => {}),
        catchError((e) => this.handleError(e))
      );
  }

  /* ****************** */

  // convert response errors in observable error
  private ensureSuccessResponse(response: any) {
    if ('success' in response && (response as GenericResponse).success === false) {
      throw new Error('Service error');
    }
  }

  private handleError(error: HttpErrorResponse) {
    /* eslint-disable no-console */ /* FIXME: to be done properly */

    if (error.error instanceof ErrorEvent) {
      console.error('An error occurred:', error.error.message);
    } else {
      console.error(
        `Backend returned code ${error.status}, ` + 'body was', error.error
      );
    }

    return throwError(new Error('Something bad happened; please try again later.'));
  }
}
