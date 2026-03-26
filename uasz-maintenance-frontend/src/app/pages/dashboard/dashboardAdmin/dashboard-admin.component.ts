// src/app/pages/dashboard/dashboardAdmin/dashboard-admin.component.ts

import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { 
  UtilisateursService, 
  UtilisateurDto, 
  CreateUtilisateurRequest,
  UpdateUtilisateurRequest 
} from '../../../core/services/utilisateurs.service';
import { PannesApiService } from '../../../core/services/pannes-api.service';
import { EquipementsApiService } from '../../../core/services/equipements-api.service';
import { AuthService } from '../../../core/services/auth';
import { environment } from '../../../../environments/environment';
import { PanneApi, PanneRequest } from '../../../core/models/panne.model';
import { EquipementApi } from '../../../core/models/equipement.model';
import { NotificationBellComponent } from '../../../shared/components/notification-bell/notification-bell.component';
import { LieuAutocompleteComponent } from '../../../shared/components/lieu-autocomplete/lieu-autocomplete.component';
import { EquipementAutocompleteComponent } from '../../../shared/components/equipement-autocomplete/equipement-autocomplete.component';
import { Subscription, interval, fromEvent } from 'rxjs';
import { switchMap, filter } from 'rxjs/operators';

type DemandeStatut = 'EN_ATTENTE' | 'EN_COURS' | 'RESOLUE';
type UrgenceNiveau = 'BASSE' | 'MOYENNE' | 'HAUTE';

interface Demande {
  id: number;
  titre: string;
  dateCreation: Date;
  statut: DemandeStatut;
  lieu: string;
  typeEquipement: string;
  description: string;
  imageFileName?: string;
  imageUrl?: string;
  urgenceDemandeur: UrgenceNiveau;
  urgenceResponsable?: UrgenceNiveau;
  urgence: UrgenceNiveau;
  nbRelances?: number;
  dateDerniereRelance?: Date;
}

interface NouvelleDemandeForm {
  titre: string;
  lieu: string;
  typeEquipement: string;
  typeEquipementAutre: string;
  equipementId: number | null;
  description: string;
  imageFile: File | null;
  imagePreview: string | null;
  urgenceDemandeur: UrgenceNiveau | null;
}

interface AdminStats {
  totalUtilisateurs: number;
  comptesActifs: number;
  comptesDesactives: number;
  rolesDisponibles: number;
  parRole: { [key: string]: number };
}

@Component({
  selector: 'app-dashboard-admin',
  standalone: true,
  imports: [CommonModule, FormsModule, NotificationBellComponent, LieuAutocompleteComponent, EquipementAutocompleteComponent],
  templateUrl: './dashboard-admin.component.html',
  styleUrls: ['./dashboard-admin.component.scss'],
})
export class DashboardAdminComponent implements OnInit, OnDestroy {
  username = 'Administrateur';
  nom = '';
  prenom = '';

  private mesDemandessPollingSubscription?: Subscription;
  usernameInitial = 'A';
  userMenuOpen = false;
  sidebarOpen = false;
  sidebarCollapsed = false;

  activeItem: 'dashboard' | 'utilisateurs' | 'mes-demandes' | 'roles' | 'importExport' | 'journal' | 'help' | 'profil' = 'dashboard';

  // FAQ Aide & Support
  activeFaqIndex: number | null = null;
  toggleFaq(index: number): void {
    this.activeFaqIndex = this.activeFaqIndex === index ? null : index;
  }
  openDocumentation(): void {
    window.open('https://uasz.sn', '_blank');
  }

  utilisateurs: UtilisateurDto[] = [];
  filteredUtilisateurs: UtilisateurDto[] = [];
  stats: AdminStats = {
    totalUtilisateurs: 0,
    comptesActifs: 0,
    comptesDesactives: 0,
    rolesDisponibles: 5,
    parRole: {}
  };
  derniersUtilisateurs: UtilisateurDto[] = [];

  // Filtres
  roleFilter: 'TOUS' | 'DEMANDEUR' | 'TECHNICIEN' | 'RESPONSABLE_MAINTENANCE' | 'SUPERVISEUR' | 'ADMINISTRATEUR' = 'TOUS';
  statusFilter: 'TOUS' | 'ACTIF' | 'INACTIF' = 'TOUS';
  searchTerm = '';

  // Pagination
  currentPage = 1;
  pageSize = 5;
  totalPages = 1;
  totalUtilisateurs = 0;
  paginatedUtilisateurs: UtilisateurDto[] = [];
  totalPagesArray: number[] = [];
  pageStartIndex = 0;
  pageEndIndex = 0;

  // Pagination pour "Derniers utilisateurs"
  derniersCurrentPage = 1;
  derniersPageSize = 5;
  derniersTotalPages = 1;
  derniersPaginatedUtilisateurs: UtilisateurDto[] = [];
  derniersTotalPagesArray: number[] = [];
  derniersPageStartIndex = 0;
  derniersPageEndIndex = 0;

  // Modales
  showCreateModal = false;
  showEditModal = false;
  showDeleteModal = false;
  showLogoutModal = false;
  showUserDetailsModal = false;
  showToggleEnabledModal = false;
  selectedUser: UtilisateurDto | null = null;
  selectedUserDetails: UtilisateurDto | null = null;
  userToToggle: UtilisateurDto | null = null;

  // Formulaires
  newUser: any = {
    username: '',
    password: '',
    email: '',
    nom: '',
    prenom: '',
    telephone: '',
    role: 'DEMANDEUR',
    categorie: '',
    sousCategorie: ''
  };

  editUser: any = {};
  formError = '';
  isSubmitting = false;

  // Visibilité du mot de passe pour l'édition d'utilisateur
  showEditUserPassword = false;

  // Formulaire profil admin
  profilForm = {
    nom: '',
    prenom: '',
    email: '',
    telephone: '',
    service: '',
    departement: '',
    motDePasseActuel: '',
    nouveauMotDePasse: '',
    confirmationMotDePasse: ''
  };

  // Visibilité des mots de passe pour le profil
  showCurrentPassword = false;
  showNewPassword = false;
  showConfirmPassword = false;

  // Toast
  toastVisible = false;
  toastMessage = '';
  toastType: 'success' | 'error' | 'info' = 'info';

  // Loading
  loading = false;

  // Demandes d'intervention
  demandes: Demande[] = [];
  readonly MAX_IMAGE_SIZE = 2 * 1024 * 1024; // 2 Mo
  readonly ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/jpg'];
  imageErrorMessage: string | null = null;
  equipementsApi: EquipementApi[] = [];
  equipementsLoading = false;
  equipementsError: string | null = null;
  Math = Math; // Pour utiliser Math dans le template
  
  equipementsPreset: string[] = [
    'Ordinateur de bureau',
    'Imprimante',
    'Scanner',
    'Vidéoprojecteur',
    'Routeur / Wi-Fi',
    'Switch',
    'Onduleur',
    'Climatiseur',
    'Robinet',
    'Ventilateur',
    'Photocopieuse',
    'Serveur',
    'Écran / Moniteur',
    'Clavier / Souris',
    'AUTRE',
  ];

  selectedEquipementPreset: string = '';
  equipementAutre: string = '';
  
  // Filtres demandes
  demandeStatutFilter: 'TOUTES' | DemandeStatut = 'TOUTES';
  demandeUrgenceFilter: 'TOUTES' | UrgenceNiveau = 'TOUTES';
  demandeSearchTerm = '';
  
  // Pagination demandes
  demandePageSize = 5;
  demandeCurrentPage = 1;
  
  // Modales demandes
  showNewDemandeModal = false;
  showDemandeDetailsModal = false;
  selectedDemande: Demande | null = null;
  showImageInDetails = false;
  
  /* ----- LIGHTBOX IMAGE ----- */
  isImageLightboxOpen = false;
  lightboxImageSrc: string | null = null;
  
  newDemande: NouvelleDemandeForm = {
    titre: '',
    lieu: '',
    typeEquipement: '',
    typeEquipementAutre: '',
    equipementId: null,
    description: '',
    imageFile: null,
    imagePreview: null,
    urgenceDemandeur: null,
  };

  constructor(
    private router: Router,
    private utilisateursService: UtilisateursService,
    private pannesApi: PannesApiService,
    private equipementsApiService: EquipementsApiService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    const storedUsername = localStorage.getItem('auth_username');
    const storedNom = localStorage.getItem('auth_nom');
    const storedPrenom = localStorage.getItem('auth_prenom');
    
    if (storedUsername) {
      this.username = storedUsername;
      this.usernameInitial = storedUsername.charAt(0).toUpperCase();
    }
    
    if (storedNom) {
      this.nom = storedNom;
    }
    
    if (storedPrenom) {
      this.prenom = storedPrenom;
    }
    this.chargerUtilisateurs();
    this.loadMesDemandes();
    this.loadEquipements();

    // 🔄 Polling "Mes demandes" — actif seulement si l'onglet navigateur est visible
    this.mesDemandessPollingSubscription = fromEvent(document, 'visibilitychange').pipe(
      filter(() => !document.hidden && this.activeItem === 'mes-demandes'),
      switchMap(() => interval(15000))
    ).subscribe(() => {
      if (!document.hidden && this.activeItem === 'mes-demandes') {
        this.loadMesDemandes();
      }
    });
  }

  ngOnDestroy(): void {
    if (this.mesDemandessPollingSubscription) {
      this.mesDemandessPollingSubscription.unsubscribe();
    }
    // Nettoyer la classe modal-open si le composant est détruit
    document.body.classList.remove('modal-open');
  }

  // Méthodes pour gérer le scroll du body
  private lockBodyScroll(): void {
    document.body.classList.add('modal-open');
  }

  private unlockBodyScroll(): void {
    document.body.classList.remove('modal-open');
  }

  chargerUtilisateurs(): void {
      this.loading = true;
      this.utilisateursService.getAll().subscribe({
        next: (users) => {
          this.utilisateurs = users;
          this.calculerStats();

          // Trier tous les utilisateurs par date de création (les plus récents en premier)
          this.derniersUtilisateurs = [...users].sort((a, b) => {
            const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
            const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
            return dateB - dateA; // Ordre décroissant (plus récent en premier)
          });

          // Appliquer la pagination pour "Derniers utilisateurs"
          this.updateDerniersPagination();

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
    this.totalUtilisateurs = this.utilisateurs.length;
    this.stats.comptesActifs = this.utilisateurs.filter(u => u.enabled).length;
    this.stats.comptesDesactives = this.utilisateurs.filter(u => !u.enabled).length;
    this.stats.rolesDisponibles = 5; // DEMANDEUR, TECHNICIEN, RESPONSABLE, SUPERVISEUR, ADMIN
    
    this.stats.parRole = {};
    this.utilisateurs.forEach(u => {
      this.stats.parRole[u.role] = (this.stats.parRole[u.role] || 0) + 1;
    });
  }

  getStatusCount(status: 'ACTIF' | 'INACTIF'): number {
    if (status === 'ACTIF') {
      return this.utilisateurs.filter(u => u.enabled).length;
    } else {
      return this.utilisateurs.filter(u => !u.enabled).length;
    }
  }

  setActive(item: typeof this.activeItem): void {
    this.activeItem = item;
    this.userMenuOpen = false;
    this.sidebarOpen = false;
  }

  toggleUserMenu(event?: Event): void {
    if (event) {
      event.stopPropagation();
    }
    this.userMenuOpen = !this.userMenuOpen;
  }

  closeUserMenu(): void {
    this.userMenuOpen = false;
  }

  goToDashboard(): void {
    this.setActive('dashboard');
  }

  goToProfile(): void {
    this.setActive('profil');
    this.userMenuOpen = false;
    this.loadProfilData();
  }

  loadProfilData(): void {
    const storedNom = localStorage.getItem('auth_nom') || '';
    const storedPrenom = localStorage.getItem('auth_prenom') || '';
    const storedEmail = localStorage.getItem('auth_email') || '';
    const storedUsername = localStorage.getItem('auth_username') || '';
    
    this.profilForm.nom = storedNom;
    this.profilForm.prenom = storedPrenom;
    this.profilForm.email = storedEmail || `${storedUsername}@uasz.sn`;
    this.profilForm.telephone = localStorage.getItem('auth_telephone') || '';
    this.profilForm.service = localStorage.getItem('auth_service') || 'Service Administration';
    this.profilForm.departement = localStorage.getItem('auth_departement') || 'Département IT';
  }

  resetProfilForm(): void {
    this.loadProfilData();
    this.profilForm.motDePasseActuel = '';
    this.profilForm.nouveauMotDePasse = '';
    this.profilForm.confirmationMotDePasse = '';
  }

  enregistrerProfil(): void {
    // Validation basique
    if (!this.profilForm.nom || !this.profilForm.prenom || !this.profilForm.email) {
      this.showToast('Veuillez remplir tous les champs obligatoires', 'error');
      return;
    }

    // Sauvegarder dans localStorage (en attendant l'API)
    localStorage.setItem('auth_nom', this.profilForm.nom);
    localStorage.setItem('auth_prenom', this.profilForm.prenom);
    localStorage.setItem('auth_email', this.profilForm.email);
    localStorage.setItem('auth_telephone', this.profilForm.telephone);
    localStorage.setItem('auth_service', this.profilForm.service);
    localStorage.setItem('auth_departement', this.profilForm.departement);

    // Mettre à jour le nom affiché
    this.nom = this.profilForm.nom;
    this.prenom = this.profilForm.prenom;
    this.username = `${this.profilForm.prenom} ${this.profilForm.nom}`;
    this.usernameInitial = this.profilForm.prenom.charAt(0).toUpperCase();

    this.showToast('Profil mis à jour avec succès', 'success');
  }

  mettreAJourMotDePasse(): void {
    // Validation du mot de passe
    if (!this.profilForm.motDePasseActuel) {
      this.showToast('Veuillez saisir votre mot de passe actuel', 'error');
      return;
    }
    if (!this.profilForm.nouveauMotDePasse) {
      this.showToast('Veuillez saisir un nouveau mot de passe', 'error');
      return;
    }
    if (this.profilForm.nouveauMotDePasse !== this.profilForm.confirmationMotDePasse) {
      this.showToast('Les mots de passe ne correspondent pas', 'error');
      return;
    }
    if (this.profilForm.nouveauMotDePasse.length < 8) {
      this.showToast('Le mot de passe doit contenir au moins 8 caractères', 'error');
      return;
    }

    // Appeler l'API pour changer le mot de passe
    this.authService.changePassword(
      this.profilForm.motDePasseActuel,
      this.profilForm.nouveauMotDePasse
    ).subscribe({
      next: (response: any) => {
        this.showToast('Mot de passe mis à jour avec succès', 'success');
        
        // Réinitialiser les champs de mot de passe
        this.profilForm.motDePasseActuel = '';
        this.profilForm.nouveauMotDePasse = '';
        this.profilForm.confirmationMotDePasse = '';
      },
      error: (error: any) => {
        console.error('❌ Erreur changement mot de passe:', error);
        
        // Afficher le message d'erreur du backend
        let errorMessage = 'Erreur lors du changement de mot de passe';
        if (error.error && typeof error.error === 'string') {
          errorMessage = error.error;
        } else if (error.error && error.error.message) {
          errorMessage = error.error.message;
        } else if (error.status === 401) {
          errorMessage = 'Le mot de passe actuel est incorrect';
        }
        
        this.showToast(errorMessage, 'error');
      }
    });
  }

  openLogoutModal(): void {
    this.userMenuOpen = false; // Fermer le menu utilisateur
    this.showLogoutModal = true;
    this.lockBodyScroll();
  }

  closeLogoutModal(): void {
    this.showLogoutModal = false;
    this.unlockBodyScroll();
  }

  confirmLogout(): void {
    this.showLogoutModal = false;
    this.unlockBodyScroll();
    this.logout();
  }

  logout(): void {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_username');
    localStorage.removeItem('auth_role');
    this.router.navigate(['/login'], { replaceUrl: true });
  }

  // Filtres
  onRoleFilterChange(role: typeof this.roleFilter): void {
    this.roleFilter = role;
    this.currentPage = 1;
    this.appliquerFiltres();
  }

  onStatusFilterChange(status: typeof this.statusFilter): void {
    this.statusFilter = status;
    this.currentPage = 1;
    this.appliquerFiltres();
  }

  onSearchTermChange(term: string): void {
    this.searchTerm = term;
    this.currentPage = 1;
    this.appliquerFiltres();
  }

  appliquerFiltres(): void {
    let filtered = [...this.utilisateurs];

    // Filtre par rôle
    if (this.roleFilter !== 'TOUS') {
      filtered = filtered.filter(u => u.role === this.roleFilter);
    }

    // Filtre par statut
    if (this.statusFilter === 'ACTIF') {
      filtered = filtered.filter(u => u.enabled);
    } else if (this.statusFilter === 'INACTIF') {
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

    this.filteredUtilisateurs = filtered;
    this.totalPages = Math.max(1, Math.ceil(filtered.length / this.pageSize));
    this.totalPagesArray = Array.from({ length: this.totalPages }, (_, i) => i + 1);
    this.paginer();
  }

  paginer(): void {
    const start = (this.currentPage - 1) * this.pageSize;
    const end = start + this.pageSize;
    this.paginatedUtilisateurs = this.filteredUtilisateurs.slice(start, end);
    this.pageStartIndex = start + 1;
    this.pageEndIndex = Math.min(end, this.filteredUtilisateurs.length);
  }

  previousPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.paginer();
    }
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.paginer();
    }
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.paginer();
    }
  }

  getVisibleUtilisateursPages(): (number | string)[] {
    const maxVisible = 7;
    const pages: (number | string)[] = [];
    
    if (this.totalPages <= maxVisible) {
      for (let i = 1; i <= this.totalPages; i++) {
        pages.push(i);
      }
    } else {
      pages.push(1);
      
      let startPage: number;
      let endPage: number;
      
      if (this.currentPage <= 4) {
        startPage = 2;
        endPage = 6;
      } else if (this.currentPage >= this.totalPages - 3) {
        startPage = this.totalPages - 5;
        endPage = this.totalPages - 1;
      } else {
        startPage = this.currentPage - 2;
        endPage = this.currentPage + 2;
      }
      
      if (startPage > 2) {
        pages.push('...');
      }
      
      for (let i = startPage; i <= endPage; i++) {
        pages.push(i);
      }
      
      if (endPage < this.totalPages - 1) {
        pages.push('...');
      }
      
      pages.push(this.totalPages);
    }
    
    return pages;
  }

  // Pagination pour "Derniers utilisateurs"
  updateDerniersPagination(): void {
    const total = this.derniersUtilisateurs.length;
    this.derniersTotalPages = Math.max(1, Math.ceil(total / this.derniersPageSize));
    
    // Générer le tableau des pages
    this.derniersTotalPagesArray = Array.from({ length: this.derniersTotalPages }, (_, i) => i + 1);
    
    // Paginer les résultats
    this.derniersPaginer();
  }

  derniersPaginer(): void {
    const start = (this.derniersCurrentPage - 1) * this.derniersPageSize;
    const end = start + this.derniersPageSize;
    this.derniersPaginatedUtilisateurs = this.derniersUtilisateurs.slice(start, end);
    this.derniersPageStartIndex = start + 1;
    this.derniersPageEndIndex = Math.min(end, this.derniersUtilisateurs.length);
  }

  derniersPreviousPage(): void {
    if (this.derniersCurrentPage > 1) {
      this.derniersCurrentPage--;
      this.derniersPaginer();
    }
  }

  derniersNextPage(): void {
    if (this.derniersCurrentPage < this.derniersTotalPages) {
      this.derniersCurrentPage++;
      this.derniersPaginer();
    }
  }

  derniersGoToPage(page: number): void {
    if (page >= 1 && page <= this.derniersTotalPages) {
      this.derniersCurrentPage = page;
      this.derniersPaginer();
    }
  }

  // CRUD Operations
  openCreateModal(): void {
    this.newUser = {
      username: '',
      password: '',
      email: '',
      nom: '',
      prenom: '',
      telephone: '',
      role: 'DEMANDEUR',
      categorie: '',
      sousCategorie: ''
    };
    this.formError = '';
    this.showCreateModal = true;
    this.lockBodyScroll();
  }

  closeCreateModal(): void {
    this.showCreateModal = false;
    this.formError = '';
    this.unlockBodyScroll();
  }

  createUser(): void {
    if (!this.newUser.username || !this.newUser.role) {
      this.formError = 'Veuillez remplir tous les champs obligatoires';
      return;
    }

    this.isSubmitting = true;
    const request: CreateUtilisateurRequest = {
      username: this.newUser.username,
      motDePasse: null as any, // null pour que le backend utilise le mot de passe par défaut
      email: this.newUser.email,
      nom: this.newUser.nom,
      prenom: this.newUser.prenom,
      role: this.newUser.role,
      telephone: this.newUser.telephone || '',
      departement: this.newUser.categorie || '',
      serviceUnite: this.newUser.sousCategorie || ''
    };

    this.utilisateursService.create(request).subscribe({
      next: () => {
        this.showToast('Utilisateur créé avec succès. Un email avec le mot de passe temporaire a été envoyé.', 'success');
        this.closeCreateModal();
        this.chargerUtilisateurs();
        this.isSubmitting = false;
      },
      error: (err) => {
        console.error('Erreur création utilisateur:', err);
        
        // Afficher le message d'erreur spécifique du backend
        if (err.error && typeof err.error === 'string') {
          this.formError = err.error;
        } else if (err.status === 409) {
          this.formError = 'Ce nom d\'utilisateur ou cet email existe déjà';
        } else if (err.status === 400) {
          this.formError = 'Données invalides. Veuillez vérifier les informations';
        } else {
          this.formError = 'Erreur lors de la création de l\'utilisateur';
        }
        
        this.isSubmitting = false;
      }
    });
  }

  openEditModal(user: UtilisateurDto): void {
    this.selectedUser = user;
    this.editUser = {
      username: user.username || '',
      email: user.email || '',
      nom: user.nom || '',
      prenom: user.prenom || '',
      telephone: user.telephone || '',
      // Mapper departement et serviceUnite vers categorie et sousCategorie pour le formulaire
      categorie: user.departement || '',
      sousCategorie: user.serviceUnite || '',
      role: user.role,
      enabled: user.enabled ?? true,
      newPassword: '' // Champ pour le nouveau mot de passe
    };
    this.formError = '';
    this.showEditModal = true;
    this.lockBodyScroll();
  }

  closeEditModal(): void {
    this.showEditModal = false;
    this.selectedUser = null;
    this.formError = '';
    this.unlockBodyScroll();
  }

  updateUser(): void {
    if (!this.selectedUser) return;

    this.isSubmitting = true;
    const request: UpdateUtilisateurRequest = {
      email: this.editUser.email,
      nom: this.editUser.nom,
      prenom: this.editUser.prenom,
      telephone: this.editUser.telephone,
      // Mapper categorie et sousCategorie vers departement et serviceUnite pour le backend
      departement: this.editUser.categorie,
      serviceUnite: this.editUser.sousCategorie,
      role: this.editUser.role,
      enabled: this.editUser.enabled
    };

    this.utilisateursService.update(this.selectedUser.id, request).subscribe({
      next: () => {
        // Si un nouveau mot de passe est fourni, le changer
        if (this.editUser.newPassword && this.editUser.newPassword.trim()) {
          this.utilisateursService.resetPassword(this.selectedUser!.id, this.editUser.newPassword).subscribe({
            next: () => {
              this.showToast('Utilisateur et mot de passe modifiés avec succès', 'success');
              this.closeEditModal();
              this.chargerUtilisateurs();
              this.isSubmitting = false;
            },
            error: (err) => {
              console.error('Erreur changement mot de passe:', err);
              this.showToast('Utilisateur modifié mais erreur lors du changement de mot de passe', 'error');
              this.closeEditModal();
              this.chargerUtilisateurs();
              this.isSubmitting = false;
            }
          });
        } else {
          this.showToast('Utilisateur modifié avec succès', 'success');
          this.closeEditModal();
          this.chargerUtilisateurs();
          this.isSubmitting = false;
        }
      },
      error: (err) => {
        console.error('Erreur modification utilisateur:', err);
        this.formError = 'Erreur lors de la modification';
        this.isSubmitting = false;
      }
    });
  }

  toggleUserEnabled(user: UtilisateurDto): void {
    this.userToToggle = user;
    this.showToggleEnabledModal = true;
    this.lockBodyScroll();
  }

  closeToggleEnabledModal(): void {
    this.showToggleEnabledModal = false;
    this.userToToggle = null;
    this.unlockBodyScroll();
  }

  confirmToggleEnabled(): void {
    if (!this.userToToggle) return;

    const newStatus = !this.userToToggle.enabled;
    this.utilisateursService.toggleEnabled(this.userToToggle.id, newStatus).subscribe({
      next: () => {
        this.showToast(
          newStatus ? 'Compte activé avec succès' : 'Compte désactivé avec succès',
          'success'
        );
        this.closeToggleEnabledModal();
        this.chargerUtilisateurs();
      },
      error: (err) => {
        console.error('Erreur changement statut:', err);
        this.showToast('Erreur lors du changement de statut', 'error');
        this.closeToggleEnabledModal();
      }
    });
  }

  openDeleteModal(user: UtilisateurDto): void {
    this.selectedUser = user;
    this.showDeleteModal = true;
    this.lockBodyScroll();
  }

  closeDeleteModal(): void {
    this.showDeleteModal = false;
    this.selectedUser = null;
    this.unlockBodyScroll();
  }

  // ===== MODAL DÉTAILS UTILISATEUR =====
  openUserDetailsModal(user: UtilisateurDto): void {
    this.selectedUserDetails = user;
    this.showUserDetailsModal = true;
    this.lockBodyScroll();
  }

  closeUserDetailsModal(): void {
    this.showUserDetailsModal = false;
    this.selectedUserDetails = null;
    this.unlockBodyScroll();
  }

  editUserFromDetails(): void {
    if (this.selectedUserDetails) {
      const userToEdit = this.selectedUserDetails; // Sauvegarder avant de fermer
      this.closeUserDetailsModal();
      this.openEditModal(userToEdit);
    }
  }

  getInitials(user: UtilisateurDto): string {
    if (user.prenom && user.nom) {
      return (user.prenom.charAt(0) + user.nom.charAt(0)).toUpperCase();
    }
    if (user.nom) {
      return user.nom.charAt(0).toUpperCase();
    }
    if (user.prenom) {
      return user.prenom.charAt(0).toUpperCase();
    }
    return user.username.charAt(0).toUpperCase();
  }

  deleteUser(): void {
    if (!this.selectedUser) return;

    this.isSubmitting = true;
    this.utilisateursService.delete(this.selectedUser.id).subscribe({
      next: () => {
        this.showToast('Utilisateur supprimé avec succès', 'success');
        this.closeDeleteModal();
        this.chargerUtilisateurs();
        this.isSubmitting = false;
      },
      error: (err) => {
        console.error('Erreur suppression utilisateur:', err);
        this.showToast('Erreur lors de la suppression', 'error');
        this.isSubmitting = false;
      }
    });
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

  getNomComplet(user: UtilisateurDto): string {
    if (user.nom && user.prenom) {
      return `${user.prenom} ${user.nom}`;
    } else if (user.nom) {
      return user.nom;
    } else if (user.prenom) {
      return user.prenom;
    }
    return user.username;
  }

  showToast(message: string, type: 'success' | 'error' | 'info'): void {
    this.toastMessage = message;
    this.toastType = type;
    this.toastVisible = true;
    setTimeout(() => {
      this.toastVisible = false;
    }, 3000);
  }

  getMyNomComplet(): string {
    if (this.prenom && this.nom) {
      return `${this.prenom} ${this.nom}`;
    } else if (this.prenom) {
      return this.prenom;
    } else if (this.nom) {
      return this.nom;
    }
    return this.username;
  }

  // ==================== GESTION DES DEMANDES D'INTERVENTION ====================

  loadMesDemandes(): void {
    this.pannesApi.getMesPannes().subscribe({
      next: (pannes: PanneApi[]) => {
        this.demandes = pannes.map(p => this.mapPanneToDemande(p));
      },
      error: (err: any) => {
        console.error('Erreur chargement demandes:', err);
      }
    });
  }

  private mapPanneToDemande(p: PanneApi): Demande {
    const urgenceResp = p.prioriteResponsable as UrgenceNiveau | undefined;
    const urgenceDem = (p.priorite as UrgenceNiveau) || 'MOYENNE';

    // Mapping du statut backend vers frontend
    let statutUi: DemandeStatut;
    if (p.statut === 'OUVERTE') {
      statutUi = 'EN_ATTENTE';
    } else if (p.statut === 'EN_COURS') {
      statutUi = 'EN_COURS';
    } else {
      statutUi = 'RESOLUE';
    }

    const baseUrl = environment.backendUrl;
    const imageUrl = p.imagePath ? `${baseUrl}${p.imagePath}` : undefined;

    return {
      id: p.id,
      titre: p.titre,
      dateCreation: new Date(p.dateSignalement || Date.now()),
      statut: statutUi,
      lieu: p.lieu || '',
      typeEquipement: p.typeEquipement || '',
      description: p.description || '',
      imageUrl,
      urgenceDemandeur: urgenceDem,
      urgenceResponsable: urgenceResp,
      urgence: urgenceResp || urgenceDem,
      nbRelances: p.nbRelances ?? 0,
      dateDerniereRelance: p.dateDerniereRelance ? new Date(p.dateDerniereRelance) : undefined,
    };
  }

  loadEquipements(): void {
    this.equipementsLoading = true;
    this.equipementsError = null;

    this.equipementsApiService.getAll().subscribe({
      next: (data: EquipementApi[]) => {
        this.equipementsApi = data || [];
        this.equipementsLoading = false;
      },
      error: (err) => {
        console.error('Erreur chargement équipements:', err);
        this.equipementsError = 'Impossible de charger les équipements.';
        this.equipementsLoading = false;
      }
    });
  }

  get filteredDemandes(): Demande[] {
    const term = this.demandeSearchTerm.trim().toLowerCase();

    return this.demandes.filter((d) => {
      if (this.demandeStatutFilter !== 'TOUTES' && d.statut !== this.demandeStatutFilter) {
        return false;
      }

      if (this.demandeUrgenceFilter !== 'TOUTES' && d.urgenceDemandeur !== this.demandeUrgenceFilter) {
        return false;
      }

      if (!term) return true;

      const inTitre = d.titre.toLowerCase().includes(term);
      const inLieu = d.lieu.toLowerCase().includes(term);
      const inType = d.typeEquipement.toLowerCase().includes(term);

      return inTitre || inLieu || inType;
    });
  }

  get pagedDemandes(): Demande[] {
    const filtered = this.filteredDemandes;
    const startIndex = (this.demandeCurrentPage - 1) * this.demandePageSize;
    return filtered.slice(startIndex, startIndex + this.demandePageSize);
  }

  get demandeTotalPages(): number {
    return Math.max(1, Math.ceil(this.filteredDemandes.length / this.demandePageSize));
  }

  get demandeTotalPagesArray(): number[] {
    return Array.from({ length: this.demandeTotalPages }, (_, i) => i + 1);
  }

  get demandePageStartIndex(): number {
    const total = this.filteredDemandes.length;
    return total === 0 ? 0 : (this.demandeCurrentPage - 1) * this.demandePageSize + 1;
  }

  get demandePageEndIndex(): number {
    const start = (this.demandeCurrentPage - 1) * this.demandePageSize;
    return Math.min(start + this.demandePageSize, this.filteredDemandes.length);
  }

  goToDemandePageNumber(page: number): void {
    if (page < 1 || page > this.demandeTotalPages) return;
    this.demandeCurrentPage = page;
  }

  getVisibleDemandesPages(): (number | string)[] {
    const maxVisible = 7;
    const pages: (number | string)[] = [];
    
    if (this.demandeTotalPages <= maxVisible) {
      for (let i = 1; i <= this.demandeTotalPages; i++) {
        pages.push(i);
      }
    } else {
      pages.push(1);
      
      let startPage: number;
      let endPage: number;
      
      if (this.demandeCurrentPage <= 4) {
        startPage = 2;
        endPage = 6;
      } else if (this.demandeCurrentPage >= this.demandeTotalPages - 3) {
        startPage = this.demandeTotalPages - 5;
        endPage = this.demandeTotalPages - 1;
      } else {
        startPage = this.demandeCurrentPage - 2;
        endPage = this.demandeCurrentPage + 2;
      }
      
      if (startPage > 2) {
        pages.push('...');
      }
      
      for (let i = startPage; i <= endPage; i++) {
        pages.push(i);
      }
      
      if (endPage < this.demandeTotalPages - 1) {
        pages.push('...');
      }
      
      pages.push(this.demandeTotalPages);
    }
    
    return pages;
  }

  openNewDemandeModal(): void {
    this.resetNewDemandeForm();
    this.showNewDemandeModal = true;
    this.lockBodyScroll();
  }

  closeNewDemandeModal(): void {
    this.showNewDemandeModal = false;
    this.resetNewDemandeForm();
    this.unlockBodyScroll();
  }

  resetNewDemandeForm(): void {
    this.newDemande = {
      titre: '',
      lieu: '',
      typeEquipement: '',
      typeEquipementAutre: '',
      equipementId: null,
      description: '',
      imageFile: null,
      imagePreview: null,
      urgenceDemandeur: null,
    };

    this.selectedEquipementPreset = '';
    this.equipementAutre = '';
    this.imageErrorMessage = null;
  }

  onImageSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) {
      this.imageErrorMessage = null;
      return;
    }

    const file = input.files[0];

    if (!this.ALLOWED_IMAGE_TYPES.includes(file.type)) {
      this.imageErrorMessage = 'Format non autorisé. Utilisez JPG, JPEG ou PNG.';
      this.newDemande.imageFile = null;
      this.newDemande.imagePreview = null;
      input.value = '';
      return;
    }

    if (file.size > this.MAX_IMAGE_SIZE) {
      this.imageErrorMessage = 'L\'image ne doit pas dépasser 2 Mo.';
      this.newDemande.imageFile = null;
      this.newDemande.imagePreview = null;
      input.value = '';
      return;
    }

    this.imageErrorMessage = null;
    this.newDemande.imageFile = file;

    const reader = new FileReader();
    reader.onload = (e: any) => {
      this.newDemande.imagePreview = e.target.result;
    };
    reader.readAsDataURL(file);
  }

  removeImage(): void {
    this.newDemande.imageFile = null;
    this.newDemande.imagePreview = null;
    this.imageErrorMessage = null;
  }

  isAutreEquipement(): boolean {
    return this.selectedEquipementPreset === 'AUTRE';
  }

  private buildTypeEquipement(): string {
    if (this.selectedEquipementPreset === 'AUTRE') {
      return `AUTRE: ${this.equipementAutre?.trim() || 'Non précisé'}`;
    }
    return this.selectedEquipementPreset?.trim() || 'Non spécifié';
  }

  isNewDemandeFormInvalid(): boolean {
    if (!this.newDemande.titre.trim()) return true;
    if (!this.newDemande.lieu.trim()) return true;
    if (!this.selectedEquipementPreset) return true;
    if (this.selectedEquipementPreset === 'AUTRE' && !this.equipementAutre.trim()) return true;    if (!this.newDemande.urgenceDemandeur) return true;
    if (!this.newDemande.imageFile) return true;
    return false;
  }

  submitNewDemande(): void {
    if (this.isNewDemandeFormInvalid()) {
      this.showToast('Veuillez remplir tous les champs obligatoires', 'error');
      return;
    }

    if (!this.newDemande.imageFile) {
      this.imageErrorMessage = 'Veuillez obligatoirement joindre une image de l\'équipement.';
      return;
    }

    const typeEquipementFinal = (this.selectedEquipementPreset ?? '').trim() || 'Non spécifié';
    const descriptionFinale = this.newDemande.description;

    const fd = new FormData();
    fd.append('titre', this.newDemande.titre);
    fd.append('description', descriptionFinale);

    const lieuFinal = (this.newDemande.lieu ?? '').trim();
    fd.append('lieu', lieuFinal);

    fd.append('typeEquipement', typeEquipementFinal);

    if (this.newDemande.urgenceDemandeur) {
      fd.append('priorite', this.newDemande.urgenceDemandeur);
    }

    fd.append('signaleePar', this.username);

    if (this.newDemande.imageFile) {
      fd.append('image', this.newDemande.imageFile);
    }

    console.log('POST /api/pannes (multipart)');
    console.log('📦 FormData envoyé :', Array.from(fd.entries()));

    this.pannesApi.createPanne(fd).subscribe({
      next: () => {
        this.showToast('Demande créée avec succès', 'success');
        this.closeNewDemandeModal();
        this.loadMesDemandes();
      },
      error: (err) => {
        if (err.status === 409) {
          this.imageErrorMessage = err.error || 'Une demande identique est déjà en cours de traitement.';
        } else if (err.status === 413) {
          this.imageErrorMessage =
            'L\'image sélectionnée est trop volumineuse. Veuillez choisir une image de moins de 2 Mo.';
        } else {
          console.error('Erreur création panne', err);
        }
      },
    });
  }

  openDemandeDetails(demande: Demande): void {
    this.selectedDemande = demande;
    this.showDemandeDetailsModal = true;
    this.showImageInDetails = false;
    this.lockBodyScroll();
  }

  closeDemandeDetails(): void {
    this.showDemandeDetailsModal = false;
    this.selectedDemande = null;
    this.showImageInDetails = false;
    this.unlockBodyScroll();
  }

  peutRelancerDemande(d: Demande): boolean {
    if (d.statut !== 'EN_ATTENTE') return false;
    const ref = d.dateDerniereRelance ?? d.dateCreation;
    const diffJours = (Date.now() - new Date(ref).getTime()) / (1000 * 60 * 60 * 24);
    return diffJours >= 2;
  }

  relancerDemande(d: Demande): void {
    this.pannesApi.relancerDemande(d.id).subscribe({
      next: (updated: any) => {
        d.dateDerniereRelance = updated.dateDerniereRelance ? new Date(updated.dateDerniereRelance) : new Date();
        d.nbRelances = (d.nbRelances ?? 0) + 1;
        this.showToast('Demande relancée avec succès.', 'success');
      },
      error: () => this.showToast('Erreur lors de la relance.', 'error'),
    });
  }

  toggleImageInDetails(): void {
    this.showImageInDetails = !this.showImageInDetails;
  }

  /* ======================= LIGHTBOX IMAGE ================ */
  
  openImageLightbox(imageSrc: string): void {
    this.lightboxImageSrc = imageSrc;
    this.isImageLightboxOpen = true;
  }

  closeImageLightbox(): void {
    this.isImageLightboxOpen = false;
    this.lightboxImageSrc = null;
  }

  @HostListener('document:keydown.escape')
  onEscapeKeyLightbox(): void {
    if (this.isImageLightboxOpen) {
      this.closeImageLightbox();
    }
  }
  // Gestion des notifications
  onNotificationClicked(notification: any): void {
    console.log('Notification cliquée:', notification);

    // Si c'est une notification d'utilisateur, aller à la page utilisateurs et ouvrir les détails
    if (notification.entityType === 'UTILISATEUR' && notification.entityId) {
      // Aller à la page utilisateurs
      this.setActive('utilisateurs');

      // Recharger les utilisateurs puis ouvrir les détails
      this.loading = true;
      this.utilisateursService.getAll().subscribe({
        next: (data: UtilisateurDto[]) => {
          this.utilisateurs = data;
          this.appliquerFiltres();
          this.loading = false;

          // Trouver et ouvrir les détails de l'utilisateur
          const user = this.utilisateurs.find((u: UtilisateurDto) => u.id === notification.entityId);
          if (user) {
            this.openUserDetailsModal(user);
          } else {
            console.error('Utilisateur non trouvé:', notification.entityId);
          }
        },
        error: (err) => {
          console.error('Erreur lors du chargement des utilisateurs:', err);
          this.loading = false;
        }
      });
    }
    
    // Si c'est une notification de panne/demande, aller à mes demandes et ouvrir les détails
    if (notification.entityType === 'PANNE' && notification.entityId) {
      // Aller à la page mes demandes
      this.setActive('mes-demandes');

      // Attendre que la page soit chargée puis ouvrir les détails de la demande
      setTimeout(() => {
        const demande = this.demandes.find((d: Demande) => d.id === notification.entityId);
        if (demande) {
          this.openDemandeDetails(demande);
        }
      }, 300);
    }
  }
}


