import { Component } from '@angular/core';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  template: `
    <div class="page">
      <h1>Tableau de bord – Administrateur</h1>
      <p>Gestion des utilisateurs et paramètres de la plateforme.</p>
    </div>
  `,
  styles: [
    `
      .page {
        padding: 2rem;
        font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI',
        sans-serif;
      }
    `,
  ],
})
export class AdminDashboardComponent {}
