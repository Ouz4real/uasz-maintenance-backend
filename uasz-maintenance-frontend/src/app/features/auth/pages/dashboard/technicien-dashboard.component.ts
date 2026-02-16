import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { HttpClient } from '@angular/common/http';

interface TechnicienDashboard {
  technicienId: number;
  username: string;
  email: string;
  totalInterventions: number;
  interventionsPlanifiees: number;
  interventionsEnCours: number;
  interventionsTerminees: number;
  interventionsAnnulees: number;
  derniereInterventionDebut?: string;
  derniereInterventionTerminee?: string;
  tempsMoyenRealisationMinutes?: number;
  totalPiecesConsommees: number;
  coutTotalPieces: number;
}

@Component({
  selector: 'app-technicien-dashboard',
  standalone: true,
  imports: [CommonModule, DatePipe],
  templateUrl: './technicien-dashboard.component.html',
  styleUrls: ['./technicien-dashboard.component.scss'],
})
export class TechnicienDashboardComponent implements OnInit {

  loading = false;
  errorMessage = '';
  data?: TechnicienDashboard;

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.loadDashboard();
  }

  loadDashboard(): void {
    this.loading = true;
    this.errorMessage = '';

    this.http
      .get<TechnicienDashboard>('http://localhost:8080/api/techniciens/mon-dashboard')
      .subscribe({
        next: (res) => {
          this.data = res;
          this.loading = false;
        },
        error: (err) => {
          console.error('Erreur dashboard technicien', err);
          this.errorMessage =
            "Impossible de charger les indicateurs pour le moment.";
          this.loading = false;
        },
      });
  }
}
