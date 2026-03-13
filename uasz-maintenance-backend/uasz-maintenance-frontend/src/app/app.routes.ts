// src/app/app.routes.ts
import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { DashboardLayoutComponent } from './layouts/dashboard-layout/dashboard';

export const routes: Routes = [
  // page par défaut -> login
  { path: '', redirectTo: 'login', pathMatch: 'full' },

  // 🔓 route publique
  {
    path: 'login',
    loadComponent: () =>
      import('./pages/login/login').then(m => m.LoginComponent),
  },

  // 🔐 toutes les routes "app" avec le layout sont protégées par le guard
  {
    path: '',
    component: DashboardLayoutComponent,
    canActivateChild: [authGuard],
    children: [
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./pages/dashboard/dashboard').then(m => m.DashboardComponent),
      },
      {
        path: 'interventions',
        loadComponent: () =>
          import('./pages/interventions/interventions')
            .then(m => m.InterventionsComponent),
      },
      {
        path: 'equipements',
        loadComponent: () =>
          import('./pages/equipements/equipements')
            .then(m => m.EquipementsComponent),
      },
    ],
  },

  // tout le reste → login
  { path: '**', redirectTo: 'login' },
];
