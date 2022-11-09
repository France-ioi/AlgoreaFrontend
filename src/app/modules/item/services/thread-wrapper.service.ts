import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ThreadWrapperService {
  private readonly opened = new BehaviorSubject<boolean>(false);
  opened$ = this.opened.asObservable();

  constructor() {
  }

  toggle(): void {
    this.opened.next(!this.opened.value);
  }

  close(): void {
    this.opened.next(false);
  }
}
