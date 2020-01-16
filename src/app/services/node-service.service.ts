import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";

import { TreeNode } from "primeng/api";

@Injectable({
  providedIn: 'root'  // <- ADD THIS
})
export class NodeService {
  constructor(private http: HttpClient) {}

  getFiles() {
    return this.http
      .get<any>("assets/showcase/data/files.json")
      .toPromise()
      .then(res => <TreeNode[]>res.data);
  }

  getTrees() {
    return this.http
      .get<any>("assets/showcase/data/trees.json")
      .toPromise()
      .then(res => <TreeNode[]>res.data);
  }

  getFilesystem() {
    return this.http
      .get<any>("assets/showcase/data/filesystem.json")
      .toPromise()
      .then(res => <TreeNode[]>res.data);
  }

  getLazyFilesystem() {
    return this.http
      .get<any>("assets/showcase/data/filesystem-lazy.json")
      .toPromise()
      .then(res => <TreeNode[]>res.data);
  }
}
