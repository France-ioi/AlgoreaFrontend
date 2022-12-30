import { ErrorHandler, Injectable } from '@angular/core';
import { ChunkErrorService } from '../../core/services/chunk-error.service';
import { convertToError } from './error-conversion';

@Injectable()
export class ChunkErrorHandler implements ErrorHandler {
  constructor(private chunkErrorService: ChunkErrorService) {
  }

  handleError(error: unknown): void {
    const regExp = /Loading chunk [a-z_\d]+ failed/;
    if (regExp.test(convertToError(error).message)) {
      this.chunkErrorService.emitError();
    }
  }
}
