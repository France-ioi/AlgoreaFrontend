import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { APPCONFIG } from 'src/app/config';
import { inject } from '@angular/core';
import { decodeSnakeCase } from 'src/app/utils/operators/decode';
import { z } from 'zod/v4';
import { itemDependencySchema } from 'src/app/items/models/item-dependency';

const itemDependenciesSchema = z.array(itemDependencySchema);

type ItemDependencies = z.infer<typeof itemDependenciesSchema>;

@Injectable({
  providedIn: 'root',
})
export class GetItemDependenciesService {
  private config = inject(APPCONFIG);

  constructor(private http: HttpClient) {}

  get(itemId: string): Observable<ItemDependencies> {
    return this.http
      .get<unknown[]>(`${this.config.apiUrl}/items/${ itemId }/dependencies`)
      .pipe(
        decodeSnakeCase(itemDependenciesSchema),
      );
  }
}
