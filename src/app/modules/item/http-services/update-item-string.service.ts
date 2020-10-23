import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ActionResponse, assertSuccess } from '../../../shared/http-services/action-response';
import { environment } from '../../../../environments/environment';
import { map } from 'rxjs/operators';

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
  ) {
    // Fixme: Get languageTag properly
    const tag = languageTag || 'default';
    return this.http.put<ActionResponse<Object>>(
      `${environment.apiUrl}/items/${itemId}/strings/${tag}`,
      changes,
    ).pipe(
      map(assertSuccess)
    );
  }
}
