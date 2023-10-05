import { Routes } from '@angular/router';
import { LTIComponent } from './pages/lti/lti.component';

const ltiRoutes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    component: LTIComponent,
  }
];

export default ltiRoutes;
