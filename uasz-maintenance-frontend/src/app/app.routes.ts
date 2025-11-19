import { Routes } from '@angular/router';
import { LoginComponent } from './pages/login/login';

export const routes: Routes = [
  { path: '', component: LoginComponent },      // page par défaut
  { path: 'login', component: LoginComponent }, // /login
  // on ajoutera /dashboard, etc. ici plus tard
];
