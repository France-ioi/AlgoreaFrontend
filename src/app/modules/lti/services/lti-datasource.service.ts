import { Injectable } from '@angular/core';

interface LTIData {
  contentId: string,
  attemptId: string,
}

@Injectable({
  providedIn: 'root',
})
export class LTIDataSource {

  data: LTIData | null = null;

}
