import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { APPCONFIG } from 'src/app/config';
import { inject } from '@angular/core';
import { map } from 'rxjs/operators';
import { ItemId, ItemPath } from '../models/ids';

interface RawItemPath { path: ItemPath }

@Injectable({
  providedIn: 'root'
})
export class GetItemPathService {
  private http = inject(HttpClient);
  private config = inject(APPCONFIG);

  getItemPath(itemId: ItemId): Observable<ItemPath> {
    return this.http.get<RawItemPath>(`${this.config.apiUrl}/items/${itemId}/path-from-root`).pipe(
      // remove the last element from the path as it is the item id itself, that we do not need in our item paths
      map(raw => raw.path.slice(0,-1))
    );
  }

}
