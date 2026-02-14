// src/app/pages/dashboard/dashboardSuperviseur/dashboard-superviseur.component.ts

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

interface StatGlobal {
  totalSignalements: number;
  totalInterventions: number;
  interventionsEnCours: number;
  tauxResolution: number;
}

interface Signalement {
  id: number;
  titre: string;
  dateCreation: Date;
  statut: string;
  lieu: string;
}

interface Intervention {
  id: number;
  titre: string;
  technicien: string;
  statut: string;
  date: Date;
}

@Component({
  selector: 'app-dashboard-superviseur',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard-superviseur.component.html',
  styleUrls: ['./dashboard-superviseur.component.scss'],
})
export class DashboardSuperviseurComponent implements OnInit {
  // Nom de l’utilisateur connecté
  username = 'Superviseur';
  usernameInitial = 'S';

  // Menu utilisateur
  userMenuOpen = false;

  // Onglet actif de la sidebar
  activeItem:
    | 'dashboard'
    | 'signalements'
    | 'interventions'
    | 'equipements'
    | 'stats'
    | 'help' = 'dashboard';

  // ==== Données mockées (tu les brancheras sur ton backend ensuite) ====
  statsGlobal: StatGlobal = {
    totalSignalements: 42,
    totalInterventions: 31,
    interventionsEnCours: 4,
    tauxResolution: 86,
  };

  signalementsRecents: Signalement[] = [
    {
      id: 101,
      titre: 'Clim labo INFO – fuite suspecte',
      dateCreation: new Date('2025-11-22'),
      statut: 'En attente',
      lieu: 'Labo INFO',
    },
    {
      id: 77,
      titre: 'PC Amphi A – écran noir',
      dateCreation: new Date('2025-11-21'),
      statut: 'En cours',
      lieu: 'Amphi A',
    },
    {
      id: 65,
      titre: 'Imprimante bloc A – bourrage',
      dateCreation: new Date('2025-11-20'),
      statut: 'Résolue',
      lieu: 'Bloc A',
    },
  ];

  interventionsRecents: Intervention[] = [
    {
      id: 501,
      titre: 'Maintenance préventive climatiseur',
      technicien: 'Fall',
      statut: 'En cours',
      date: new Date('2025-11-21'),
    },
    {
      id: 502,
      titre: 'Remplacement carte mère PC',
      technicien: 'Diop',
      statut: 'Terminée',
      date: new Date('2025-11-20'),
    },
    {
      id: 503,
      titre: 'Nettoyage vidéoprojecteur',
      technicien: 'Gaye',
      statut: 'Planifiée',
      date: new Date('2025-11-18'),
    },
  ];
  // =====================================================

  ngOnInit(): void {
    const storedUsername = localStorage.getItem('auth_username');
    if (storedUsername) {
      this.username = storedUsername;
      this.usernameInitial = storedUsername.charAt(0).toUpperCase();
    }
  }

  // Ouvrir / fermer le menu utilisateur
  toggleUserMenu(): void {
    this.userMenuOpen = !this.userMenuOpen;
  }

  // Changer l’onglet actif dans la sidebar
  setActive(
    item:
      | 'dashboard'
      | 'signalements'
      | 'interventions'
      | 'equipements'
      | 'stats'
      | 'help'
  ): void {
    this.activeItem = item;
  }

  // Bouton "Tableau de bord" dans le menu utilisateur
  goToDashboard(): void {
    this.activeItem = 'dashboard';
    this.userMenuOpen = false;
  }

  // Déconnexion
  logout(): void {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_username');
    localStorage.removeItem('auth_role');
    this.userMenuOpen = false;
    window.location.href = '/login';
  }
}
