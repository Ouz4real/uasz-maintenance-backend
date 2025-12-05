// src/app/pages/dashboard/dashboardTechnicien/dashboard-technicien.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

interface Intervention {
  id: number;
  titre: string;
  dateCreation: Date;
  statut: 'A_FAIRE' | 'EN_COURS' | 'TERMINEE';
  lieu: string;
}

@Component({
  selector: 'app-dashboard-technicien',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard-technicien.component.html',
  styleUrls: ['./dashboard-technicien.component.scss'],
})
export class DashboardTechnicienComponent implements OnInit {
  // Nom de l’utilisateur connecté
  username = 'Technicien';
  // Première lettre (avatar rond)
  usernameInitial = 'T';

  // Menu utilisateur (en haut à droite)
  userMenuOpen = false;

  // Onglet actif dans la sidebar
  activeItem: 'dashboard' | 'interventions' | 'equipements' | 'help' =
    'dashboard';

  // Données mockées pour le technicien
  interventions: Intervention[] = [
    {
      id: 1,
      titre: 'Panne PC labo INFO-201',
      dateCreation: new Date('2025-11-20'),
      statut: 'A_FAIRE',
      lieu: 'Labo INFO-201',
    },
    {
      id: 2,
      titre: 'Imprimante BIBLIO – bourrage papier',
      dateCreation: new Date('2025-11-19'),
      statut: 'EN_COURS',
      lieu: 'Bibliothèque centrale',
    },
    {
      id: 3,
      titre: 'Vidéoprojecteur Amphi B – remplacement lampe',
      dateCreation: new Date('2025-11-18'),
      statut: 'TERMINEE',
      lieu: 'Amphi B',
    },
  ];

  // Statistiques
  aFaire = 0;
  enCours = 0;
  terminees = 0;

  constructor(private router: Router) {}

  ngOnInit(): void {
    const storedUsername = localStorage.getItem('auth_username');
    if (storedUsername) {
      this.username = storedUsername;
      this.usernameInitial = storedUsername.charAt(0).toUpperCase();
    }

    this.computeStats();
  }

  private computeStats(): void {
    this.aFaire = this.interventions.filter(
      (i) => i.statut === 'A_FAIRE'
    ).length;
    this.enCours = this.interventions.filter(
      (i) => i.statut === 'EN_COURS'
    ).length;
    this.terminees = this.interventions.filter(
      (i) => i.statut === 'TERMINEE'
    ).length;
  }

  // Gestion des onglets sidebar
  setActive(item: 'dashboard' | 'interventions' | 'equipements' | 'help') {
    this.activeItem = item;
  }

  // Menu utilisateur
  toggleUserMenu(): void {
    this.userMenuOpen = !this.userMenuOpen;
  }

  goToDashboard(): void {
    this.userMenuOpen = false;
    this.activeItem = 'dashboard';
  }

  logout(): void {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_username');
    localStorage.removeItem('auth_role');

    this.userMenuOpen = false;
    this.router.navigate(['/login']);
  }
}
