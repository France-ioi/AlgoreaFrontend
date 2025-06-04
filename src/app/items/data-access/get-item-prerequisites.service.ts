import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { APPCONFIG } from 'src/app/app.config';
import { HttpClient } from '@angular/common/http';
import { z } from 'zod';
import { decodeSnakeCase } from 'src/app/utils/operators/decode';
import { itemDependencySchema } from 'src/app/items/models/item-dependency';

const itemPrerequisitesSchema = z.array(itemDependencySchema);

type ItemPrerequisites = z.infer<typeof itemPrerequisitesSchema>;

@Injectable({
  providedIn: 'root',
})
export class GetItemPrerequisitesService {
  private config = inject(APPCONFIG);

  constructor(private http: HttpClient) {}

  get(itemId: string): Observable<ItemPrerequisites> {
    return this.http
      .get<unknown[]>(`${this.config.apiUrl}/items/${ itemId }/prerequisites`)
      .pipe(
        decodeSnakeCase(itemPrerequisitesSchema),
      );
  }
}
