import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { appConfig } from 'src/app/utils/config';
import { HttpClient } from '@angular/common/http';
import { z } from 'zod';
import { decodeSnakeCaseZod } from 'src/app/utils/operators/decode';
import { itemDependencySchema } from 'src/app/items/models/item-dependency';

const itemPrerequisitesSchema = z.array(itemDependencySchema);

type ItemPrerequisites = z.infer<typeof itemPrerequisitesSchema>;

@Injectable({
  providedIn: 'root',
})
export class GetItemPrerequisitesService {

  constructor(private http: HttpClient) {}

  get(itemId: string): Observable<ItemPrerequisites> {
    return this.http
      .get<unknown[]>(`${appConfig.apiUrl}/items/${ itemId }/prerequisites`)
      .pipe(
        decodeSnakeCaseZod(itemPrerequisitesSchema),
      );
  }
}
