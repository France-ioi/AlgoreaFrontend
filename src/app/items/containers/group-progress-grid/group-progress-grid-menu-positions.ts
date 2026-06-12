import { ConnectedPosition } from '@angular/cdk/overlay';

export const groupProgressDetailMenuPositions: ConnectedPosition[] = [
  {
    originX: 'center',
    originY: 'bottom',
    overlayX: 'center',
    overlayY: 'top',
    offsetY: 10,
    panelClass: [ 'alg-top-center-triangle', 'grey' ],
  },
  {
    originX: 'center',
    originY: 'top',
    overlayX: 'center',
    overlayY: 'bottom',
    offsetY: -40,
    panelClass: [ 'alg-bottom-center-triangle', 'grey' ],
  },
  {
    originX: 'start',
    originY: 'center',
    overlayX: 'end',
    overlayY: 'center',
    offsetX: -10,
    panelClass: [ 'alg-left-center-triangle', 'grey' ],
  },
];
