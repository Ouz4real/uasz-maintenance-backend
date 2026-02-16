import { Component } from '@angular/core';

@Component({
  selector: 'app-superviseur-dashboard',
  standalone: true,
  template: `
    <div class="page">
      <h1>Tableau de bord – Superviseur</h1>
      <p>Indicateurs globaux sur la maintenance à l'UASZ.</p>
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
export class SuperviseurDashboardComponent {}
