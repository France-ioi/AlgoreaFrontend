import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

import { TreeNode } from 'primeng/api';

@Injectable({
  providedIn: 'root'  // <- ADD THIS
})
export class NodeService {
  constructor(private http: HttpClient) {}

  getFiles() {
    return this.http
      .get<any>('assets/showcase/data/files.json')
      .toPromise()
      .then(res => res.data as TreeNode[]);
  }

  getSkills() {
    return this.http
      .get<any>('assets/showcase/data/skills.json')
      .toPromise()
      .then(res => res.data as TreeNode[]);
  }

  getActivities() {
    return this.http
      .get<any>('assets/showcase/data/activities.json')
      .toPromise()
      .then(res => res.data as TreeNode[]);
  }

  getCarHuge() {
    return this.http
      .get<any>('assets/showcase/data/cars-small.json');
  }
}
