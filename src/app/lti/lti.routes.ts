import { Routes } from '@angular/router';
import { LTIComponent } from './lti.component';

const ltiRoutes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    component: LTIComponent,
  }
];

export default ltiRoutes;
