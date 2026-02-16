import { Component } from '@angular/core';

@Component({
  selector: 'app-responsable-dashboard',
  standalone: true,
  template: `
    <div class="page">
      <h1>Tableau de bord – Responsable Maintenance</h1>
      <p>Suivi global des pannes, interventions et stocks.</p>
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
export class ResponsableDashboardComponent {}
