import { Observable, forkJoin } from 'rxjs';
import { Result } from 'src/app/modules/group/helpers/response-toast';
import { PendingRequest } from 'src/app/modules/group/http-services/get-requests.service';
import { Action } from 'src/app/modules/group/http-services/request-actions.service';

export function parseResults(data: Map<string, any>[]): Result {
  const res : Result = { countRequests: 0, countSuccess: 0 };
  data.forEach(elm => {
    res.countRequests += elm.size;
    res.countSuccess += Array.from(elm.values())
      .map<number>(state => ([ 'success', 'unchanged' ].includes(state) ? 1 : 0))
      .reduce((acc, res) => acc + res, 0);
  });
  return res;
}

export function processRequests(
  processRequestsFunc: (groupId: string, memberIds: string[], action: Action) => Observable<Map<string, any>>,
  action: Action,
  requests: PendingRequest[]
): Observable<Map<string, any>[]> {
  const requestMap = new Map<string, string[]>();
  requests.forEach(elm => {
    const groupID = elm.group.id;
    const memberID = elm.user.id;

    const value = requestMap.get(groupID);
    if (value) requestMap.set(groupID, value.concat([ memberID ]));
    else requestMap.set(groupID, [ memberID ]);
  });
  return forkJoin(
    Array.from(requestMap.entries()).map(elm =>
      processRequestsFunc(elm[0], elm[1], action)
    )
  );
}
