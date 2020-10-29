import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { assertSuccess, SimpleActionResponse } from '../../../shared/http-services/action-response';
import { environment } from '../../../../environments/environment';
import { map } from 'rxjs/operators';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class UpdateItemStringService {

  constructor(private http: HttpClient) {
  }

  updateItem(
    itemId: string,
    changes: object,
    languageTag?: string
  ) : Observable<void> {
    // Fixme: Get languageTag properly
    const tag = languageTag || 'default';
    return this.http.put<SimpleActionResponse>(
      `${environment.apiUrl}/items/${itemId}/strings/${tag}`,
      changes,
    ).pipe(
      map(assertSuccess)
    );
  }
}
