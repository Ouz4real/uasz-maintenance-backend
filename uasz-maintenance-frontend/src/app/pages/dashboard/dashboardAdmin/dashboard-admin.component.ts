// src/app/pages/dashboard/dashboardAdmin/dashboard-admin.component.ts

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

interface AdminStats {
  totalUtilisateurs: number;
  comptesActifs: number;
  comptesDesactives: number;
  rolesDisponibles: number;
}

interface AdminUser {
  id: number;
  nomComplet: string;
  username: string;
  role: string;
  actif: boolean;
  dateCreation: Date;
}

@Component({
  selector: 'app-dashboard-admin',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard-admin.component.html',
  styleUrls: ['./dashboard-admin.component.scss'],
})
export class DashboardAdminComponent implements OnInit {
  // Nom de l’admin connecté
  username = 'Administrateur';
  usernameInitial = 'A';

  // Menu utilisateur
  userMenuOpen = false;

  // Onglet actif dans la sidebar
  activeItem:
    | 'dashboard'
    | 'utilisateurs'
    | 'roles'
    | 'importExport'
    | 'journal'
    | 'help' = 'dashboard';

  // Statistiques globales (mock pour l’instant)
  stats: AdminStats = {
    totalUtilisateurs: 18,
    comptesActifs: 15,
    comptesDesactives: 3,
    rolesDisponibles: 5,
  };

  // Derniers utilisateurs
  derniersUtilisateurs: AdminUser[] = [
    {
      id: 1,
      nomComplet: 'Ousmane Mané',
      username: 'ousmane',
      role: 'responsable',
      actif: true,
      dateCreation: new Date('2025-11-20'),
    },
    {
      id: 2,
      nomComplet: 'Saliou Diop',
      username: 'saliou',
      role: 'technicien',
      actif: true,
      dateCreation: new Date('2025-11-19'),
    },
    {
      id: 3,
      nomComplet: 'Awa Ndiaye',
      username: 'awa',
      role: 'demandeur',
      actif: false,
      dateCreation: new Date('2025-11-18'),
    },
  ];

  constructor(private router: Router) {}

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

  // Changer l’onglet actif
  setActive(
    item:
      | 'dashboard'
      | 'utilisateurs'
      | 'roles'
      | 'importExport'
      | 'journal'
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
    this.router.navigate(['/login']);
  }
}
