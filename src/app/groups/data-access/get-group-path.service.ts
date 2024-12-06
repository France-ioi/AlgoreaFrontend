import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { appConfig } from 'src/app/utils/config';
import { map } from 'rxjs/operators';
import * as D from 'io-ts/Decoder';
import { decodeSnakeCase } from '../../utils/operators/decode';
import { GroupId, GroupPath } from 'src/app/models/ids';

const groupPathDecoder = D.array(D.string);

const groupPathResponseDecoder = D.struct({
  path: groupPathDecoder,
});

@Injectable({
  providedIn: 'root'
})
export class GetGroupPathService {

  constructor(private http: HttpClient) {}

  getGroupPath(groupId: GroupId): Observable<GroupPath> {
    return this.http.get<unknown>(`${appConfig.apiUrl}/groups/${groupId}/path-from-root`).pipe(
      decodeSnakeCase(groupPathResponseDecoder),
      // remove the last element from the path as it is the group id itself, that we do not need in our group paths
      map(raw => raw.path.slice(0,-1)),
    );
  }

}
