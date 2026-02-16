import { Component } from '@angular/core';

@Component({
  selector: 'app-demandeur-dashboard',
  standalone: true,
  template: `
    <div class="page">
      <h1>Tableau de bord – Demandeur</h1>
      <p>Bienvenue sur votre espace de suivi des pannes.</p>
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
export class DemandeurDashboardComponent {}
