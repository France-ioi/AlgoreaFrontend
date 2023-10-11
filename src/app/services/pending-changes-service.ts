import { Injectable } from '@angular/core';
import { PendingChangesComponent } from '../guards/pending-changes-guard';

@Injectable({
  providedIn: 'root',
})
export class PendingChangesService {
  private pendingChangesComponent?: PendingChangesComponent;

  get component(): PendingChangesComponent | undefined {
    return this.pendingChangesComponent;
  }

  set(component: PendingChangesComponent): void {
    this.pendingChangesComponent = component;
  }

  clear(): void {
    this.pendingChangesComponent = undefined;
  }
}
