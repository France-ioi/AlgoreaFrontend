import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { appConfig } from 'src/app/utils/config';
import { decodeSnakeCaseZod } from 'src/app/utils/operators/decode';
import { z } from 'zod';
import { itemDependencySchema } from 'src/app/items/models/item-dependency';

const itemDependenciesSchema = z.array(itemDependencySchema);

type ItemDependencies = z.infer<typeof itemDependenciesSchema>;

@Injectable({
  providedIn: 'root',
})
export class GetItemDependenciesService {

  constructor(private http: HttpClient) {}

  get(itemId: string): Observable<ItemDependencies> {
    return this.http
      .get<unknown[]>(`${appConfig.apiUrl}/items/${ itemId }/dependencies`)
      .pipe(
        decodeSnakeCaseZod(itemDependenciesSchema),
      );
  }
}
