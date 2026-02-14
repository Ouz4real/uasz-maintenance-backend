// src/app/pages/dashboard/dashboardAdmin/dashboard-admin.component.ts

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { 
  UtilisateursService, 
  UtilisateurDto, 
  CreateUtilisateurRequest,
  UpdateUtilisateurRequest 
} from '../../../core/services/utilisateurs.service';

interface AdminStats {
  totalUtilisateurs: number;
  comptesActifs: number;
  comptesDesactives: number;
  parRole: { [key: string]: number };
}

@Component({
  selector: 'app-dashboard-admin',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './dashboard-admin.component.html',
  styleUrls: ['./dashboard-admin.component.scss'],
})
export class DashboardAdminComponent implements OnInit {
  username = 'Administrateur';
  usernameInitial = 'A';
  userMenuOpen = false;

  activeItem: 'dashboard' | 'utilisateurs' | 'roles' | 'importExport' | 'journal' | 'help' = 'dashboard';

  // Données
  utilisateurs: UtilisateurDto[] = [];
  utilisateursFiltres: UtilisateurDto[] = [];
  stats: AdminStats = {
    totalUtilisateurs: 0,
    comptesActifs: 0,
    comptesDesactives: 0,
    parRole: {}
  };

  // Filtres
  filtreRole: 'TOUS' | 'DEMANDEUR' | 'TECHNICIEN' | 'RESPONSABLE_MAINTENANCE' | 'SUPERVISEUR' | 'ADMINISTRATEUR' = 'TOUS';
  filtreStatut: 'TOUS' | 'ACTIF' | 'INACTIF' = 'TOUS';
  searchTerm = '';

  // Pagination
  currentPage = 1;
  itemsPerPage = 10;
  totalPages = 1;
  paginatedUtilisateurs: UtilisateurDto[] = [];

  // Modales
  showCreateModal = false;
  showEditModal = false;
  showDeleteConfirm = false;
  selectedUtilisateur: UtilisateurDto | null = null;

  // Formulaires
  createForm: CreateUtilisateurRequest = {
    username: '',
    password: '',
    email: '',
    nom: '',
    prenom: '',
    telephone: '',
    departement: '',
    serviceUnite: '',
    role: 'DEMANDEUR'
  };

  editForm: UpdateUtilisateurRequest = {};

  // Toast
  toastVisible = false;
  toastMessage = '';
  toastType: 'success' | 'error' | 'info' = 'info';

  // Loading
  loading = false;

  constructor(
    private router: Router,
    private utilisateursService: UtilisateursService
  ) {}

  ngOnInit(): void {
    const storedUsername = localStorage.getItem('auth_username');
    if (storedUsername) {
      this.username = storedUsername;
      this.usernameInitial = storedUsername.charAt(0).toUpperCase();
    }
    this.chargerUtilisateurs();
  }

  chargerUtilisateurs(): void {
    this.loading = true;
    this.utilisateursService.getAll().subscribe({
      next: (users) => {
        this.utilisateurs = users;
        this.calculerStats();
        this.appliquerFiltres();
        this.loading = false;
      },
      error: (err) => {
        console.error('Erreur chargement utilisateurs:', err);
        this.showToast('Erreur lors du chargement des utilisateurs', 'error');
        this.loading = false;
      }
    });
  }

  calculerStats(): void {
    this.stats.totalUtilisateurs = this.utilisateurs.length;
    this.stats.comptesActifs = this.utilisateurs.filter(u => u.enabled).length;
    this.stats.comptesDesactives = this.utilisateurs.filter(u => !u.enabled).length;
    
    this.stats.parRole = {};
    this.utilisateurs.forEach(u => {
      this.stats.parRole[u.role] = (this.stats.parRole[u.role] || 0) + 1;
    });
  }

  setActive(item: typeof this.activeItem): void {
    this.activeItem = item;
    this.userMenuOpen = false;
  }

  toggleUserMenu(): void {
    this.userMenuOpen = !this.userMenuOpen;
  }

  logout(): void {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_username');
    localStorage.removeItem('auth_role');
    this.router.navigate(['/login']);
  }

  // Filtres
  setFiltreRole(role: typeof this.filtreRole): void {
    this.filtreRole = role;
    this.currentPage = 1;
    this.appliquerFiltres();
  }

  setFiltreStatut(statut: typeof this.filtreStatut): void {
    this.filtreStatut = statut;
    this.currentPage = 1;
    this.appliquerFiltres();
  }

  appliquerFiltres(): void {
    let filtered = [...this.utilisateurs];

    // Filtre par rôle
    if (this.filtreRole !== 'TOUS') {
      filtered = filtered.filter(u => u.role === this.filtreRole);
    }

    // Filtre par statut
    if (this.filtreStatut === 'ACTIF') {
      filtered = filtered.filter(u => u.enabled);
    } else if (this.filtreStatut === 'INACTIF') {
      filtered = filtered.filter(u => !u.enabled);
    }

    // Recherche
    const term = this.searchTerm.toLowerCase().trim();
    if (term) {
      filtered = filtered.filter(u =>
        (u.username || '').toLowerCase().includes(term) ||
        (u.nom || '').toLowerCase().includes(term) ||
        (u.prenom || '').toLowerCase().includes(term) ||
        (u.email || '').toLowerCase().includes(term)
      );
    }

    this.utilisateursFiltres = filtered;
    this.totalPages = Math.max(1, Math.ceil(filtered.length / this.itemsPerPage));
    this.paginer();
  }

  paginer(): void {
    const start = (this.currentPage - 1) * this.itemsPerPage;
    const end = start + this.itemsPerPage;
    this.paginatedUtilisateurs = this.utilisateursFiltres.slice(start, end);
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.paginer();
    }
  }

  // CRUD Operations
  openCreateModal(): void {
    this.createForm = {
      username: '',
      password: '',
      email: '',
      nom: '',
      prenom: '',
      telephone: '',
      departement: '',
      serviceUnite: '',
      role: 'DEMANDEUR'
    };
    this.showCreateModal = true;
  }

  createUtilisateur(): void {
    if (!this.createForm.username || !this.createForm.password || !this.createForm.role) {
      this.showToast('Veuillez remplir tous les champs obligatoires', 'error');
      return;
    }

    this.utilisateursService.create(this.createForm).subscribe({
      next: () => {
        this.showToast('Utilisateur créé avec succès', 'success');
        this.showCreateModal = false;
        this.chargerUtilisateurs();
      },
      error: (err) => {
        console.error('Erreur création utilisateur:', err);
        this.showToast('Erreur lors de la création de l\'utilisateur', 'error');
      }
    });
  }

  openEditModal(user: UtilisateurDto): void {
    this.selectedUtilisateur = user;
    this.editForm = {
      email: user.email,
      nom: user.nom,
      prenom: user.prenom,
      telephone: user.telephone,
      departement: user.departement,
      serviceUnite: user.serviceUnite,
      role: user.role,
      enabled: user.enabled
    };
    this.showEditModal = true;
  }

  updateUtilisateur(): void {
    if (!this.selectedUtilisateur) return;

    this.utilisateursService.update(this.selectedUtilisateur.id, this.editForm).subscribe({
      next: () => {
        this.showToast('Utilisateur modifié avec succès', 'success');
        this.showEditModal = false;
        this.chargerUtilisateurs();
      },
      error: (err) => {
        console.error('Erreur modification utilisateur:', err);
        this.showToast('Erreur lors de la modification', 'error');
      }
    });
  }

  toggleEnabled(user: UtilisateurDto): void {
    const newStatus = !user.enabled;
    this.utilisateursService.toggleEnabled(user.id, newStatus).subscribe({
      next: () => {
        this.showToast(
          newStatus ? 'Compte activé avec succès' : 'Compte désactivé avec succès',
          'success'
        );
        this.chargerUtilisateurs();
      },
      error: (err) => {
        console.error('Erreur changement statut:', err);
        this.showToast('Erreur lors du changement de statut', 'error');
      }
    });
  }

  openDeleteConfirm(user: UtilisateurDto): void {
    this.selectedUtilisateur = user;
    this.showDeleteConfirm = true;
  }

  deleteUtilisateur(): void {
    if (!this.selectedUtilisateur) return;

    this.utilisateursService.delete(this.selectedUtilisateur.id).subscribe({
      next: () => {
        this.showToast('Utilisateur supprimé avec succès', 'success');
        this.showDeleteConfirm = false;
        this.chargerUtilisateurs();
      },
      error: (err) => {
        console.error('Erreur suppression utilisateur:', err);
        this.showToast('Erreur lors de la suppression', 'error');
      }
    });
  }

  closeModals(): void {
    this.showCreateModal = false;
    this.showEditModal = false;
    this.showDeleteConfirm = false;
    this.selectedUtilisateur = null;
  }

  // Helpers
  getRoleLabel(role: string): string {
    const labels: { [key: string]: string } = {
      'DEMANDEUR': 'Demandeur',
      'TECHNICIEN': 'Technicien',
      'RESPONSABLE_MAINTENANCE': 'Responsable',
      'SUPERVISEUR': 'Superviseur',
      'ADMINISTRATEUR': 'Administrateur'
    };
    return labels[role] || role;
  }

  getRoleClass(role: string): string {
    const classes: { [key: string]: string } = {
      'DEMANDEUR': 'role-demandeur',
      'TECHNICIEN': 'role-technicien',
      'RESPONSABLE_MAINTENANCE': 'role-responsable',
      'SUPERVISEUR': 'role-superviseur',
      'ADMINISTRATEUR': 'role-admin'
    };
    return classes[role] || '';
  }

  showToast(message: string, type: 'success' | 'error' | 'info'): void {
    this.toastMessage = message;
    this.toastType = type;
    this.toastVisible = true;
    setTimeout(() => {
      this.toastVisible = false;
    }, 3000);
  }
}
