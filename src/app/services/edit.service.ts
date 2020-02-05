import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class EditService {

  status = new BehaviorSubject<boolean>(false);

  constructor() { }

  setValue(val) {
    this.status.next(val);
  }

  getOb() {
    return this.status.asObservable();
  }
}
