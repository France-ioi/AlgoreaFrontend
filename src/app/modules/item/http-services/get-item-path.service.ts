import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { appConfig } from 'src/app/shared/helpers/config';
import { map } from 'rxjs/operators';

type ItemId = string;
type ItemPath = ItemId[];
interface RawItemPath { path: ItemPath }

@Injectable({
  providedIn: 'root'
})
export class GetItemPathService {

  constructor(private http: HttpClient) {}

  getItemPath(itemId: ItemId): Observable<ItemPath> {
    return this.http.get<RawItemPath>(`${appConfig.apiUrl}/items/${itemId}/path-from-root`).pipe(
      // remove the last element from the path as it is the item id itself, that we do not need in our item paths
      map(raw => raw.path.slice(0,-1))
    );
  }

}
