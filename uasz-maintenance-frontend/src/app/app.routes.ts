// src/app/app.routes.ts
import { Routes } from '@angular/router';
import { LoginComponent } from './pages/login/login.component';
import { DashboardDemandeurComponent } from './pages/dashboard/dashboardDemandeur/dashboard-demandeur.component';
import { DashboardTechnicienComponent } from './pages/dashboard/dashboardTechnicien/dashboard-technicien.component';
import { DashboardResponsableComponent } from './pages/dashboard/dashboardResponsable/dashboard-responsable.component';
import { DashboardSuperviseurComponent } from './pages/dashboard/dashboardSuperviseur/dashboard-superviseur.component';
import { DashboardAdminComponent } from './pages/dashboard/dashboardAdmin/dashboard-admin.component';
import { ProfileComponent } from './pages/profile/profile.component';

import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'login' },

  { path: 'login', component: LoginComponent },


  // Profil (commun à tous les rôles)
  {
    path: 'profil',
    component: ProfileComponent,
    canActivate: [authGuard],
  },

  // Dashboard DEMANDEUR
  {
    path: 'dashboard/demandeur',
    component: DashboardDemandeurComponent,
    canActivate: [authGuard],
  },

  // Dashboard TECHNICIEN
  {
    path: 'dashboard/technicien',
    component: DashboardTechnicienComponent,
    canActivate: [authGuard],
  },
  {
    path: 'dashboard/responsable',
    component: DashboardResponsableComponent,
    canActivate: [authGuard],
  },
  {
    path: 'dashboard/superviseur',
    component: DashboardSuperviseurComponent,
    canActivate: [authGuard],
  },  {
    path: 'dashboard/admin',
    component: DashboardAdminComponent,
    canActivate: [authGuard],
  },

  // fallback
  { path: '**', redirectTo: 'login' },
];
