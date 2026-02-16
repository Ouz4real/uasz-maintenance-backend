import { Routes } from '@angular/router';

import { LoginComponent } from './features/auth/pages/login/login.component';

// 👉 Tous les dashboards sont dans features/auth/pages/dashboard
import { DemandeurDashboardComponent } from './features/auth/pages/dashboard/demandeur-dashboard.component';
import { TechnicienDashboardComponent } from './features/auth/pages/dashboard/technicien-dashboard.component';
import { ResponsableDashboardComponent } from './features/auth/pages/dashboard/responsable-dashboard.component';
import { SuperviseurDashboardComponent } from './features/auth/pages/dashboard/superviseur-dashboard.component';
import { AdminDashboardComponent } from './features/auth/pages/dashboard/admin-dashboard.component';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },

  { path: 'demandeur/dashboard', component: DemandeurDashboardComponent },
  { path: 'technicien/dashboard', component: TechnicienDashboardComponent },
  { path: 'responsable/dashboard', component: ResponsableDashboardComponent },
  { path: 'superviseur/dashboard', component: SuperviseurDashboardComponent },
  { path: 'admin/dashboard', component: AdminDashboardComponent },

  { path: '', pathMatch: 'full', redirectTo: 'login' },
  { path: '**', redirectTo: 'login' },
];
