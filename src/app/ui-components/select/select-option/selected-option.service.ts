import { Injectable, signal } from '@angular/core';

export interface SelectOption {
  label: string,
  value: string,
}

@Injectable()
export class SelectedOptionService {
  readonly selected = signal<SelectOption | undefined>(undefined);
}
