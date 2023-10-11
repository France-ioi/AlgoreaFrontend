import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ChunkErrorService {
  error$ = new Subject<Error>();

  emitError(): void {
    this.error$.next(new Error('ChunkError'));
  }
}
