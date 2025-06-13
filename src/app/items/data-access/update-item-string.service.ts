import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { assertSuccess, SimpleActionResponse } from 'src/app/data-access/action-response';
import { map } from 'rxjs/operators';
import { Observable } from 'rxjs';
import { APPCONFIG } from 'src/app/config';

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
  private config = inject(APPCONFIG);

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
      `${this.config.apiUrl}/items/${itemId}/strings/${tag}`,
      changes,
    ).pipe(
      map(assertSuccess)
    );
  }
}
