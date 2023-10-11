import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { assertSuccess, SimpleActionResponse } from 'src/app/data-access/action-response';
import { map } from 'rxjs/operators';
import { Observable } from 'rxjs';
import { appConfig } from 'src/app/utils/config';

export interface ItemStringChanges {
  description?: string | null,
  image_url?: string | null,
  subtitle?: string | null,
  title?: string,
}

@Injectable({
  providedIn: 'root'
})
export class UpdateItemStringService {

  constructor(private http: HttpClient) {
  }

  updateItem(
    itemId: string,
    changes: ItemStringChanges,
    languageTag?: string
  ) : Observable<void> {
    // Fixme: Get languageTag properly
    const tag = languageTag || 'default';
    return this.http.put<SimpleActionResponse>(
      `${appConfig.apiUrl}/items/${itemId}/strings/${tag}`,
      changes,
    ).pipe(
      map(assertSuccess)
    );
  }
}
