import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { map } from 'rxjs/operators';

interface RawRecentActivity {
  created_at: string;
  id: string;
  item: {
    id: string;
    string: {
      title: string;
    };
    type: 'Chapter'|'Task'|'Course';
  };
  score: number|null;
  user: {
    first_name: string|null;
    last_name: string|null;
    login: string;
  };
}

export interface RecentActivity {
  createdAt: Date;
  id: string;
  item: {
    id: string;
    title: string;
    type: 'Chapter'|'Task'|'Course';
  };
  score: number|null;
  user: {
    firstName: string|null;
    lastName: string|null;
    login: string;
  };
}

@Injectable({
  providedIn: 'root'
})
export class RecentActivityService {

  constructor(private http: HttpClient) { }

  getRecentActivity(
    itemId: string,
    groupId: string
  ): Observable<RecentActivity[]> {
    let params = new HttpParams();
    params = params.set('item_id', itemId);
    params = params.set('limit', '100');
    // Params not handled yet : validated, sort, from.created_at, from.id
    return this.http
      .get<RawRecentActivity[]>(`${environment.apiUrl}/groups/${groupId}/recent_activity`, { params: params })
      .pipe(
        map(activities => activities.map(activity => ({
          createdAt: new Date(activity.created_at),
          id: activity.id,
          item: {
            id: activity.item.id,
            title: activity.item.string.title,
            type: activity.item.type
          },
          score: activity.score,
          user: {
            firstName: activity.user.first_name,
            lastName: activity.user.last_name,
            login: activity.user.login
          }
        })))
      );
  }
}
