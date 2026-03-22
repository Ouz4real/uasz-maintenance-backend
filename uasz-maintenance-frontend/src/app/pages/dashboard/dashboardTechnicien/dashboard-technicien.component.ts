import {
  Component,
  OnInit,
  OnDestroy,
  ViewChild,
  ElementRef,
  HostListener
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { PannesService } from '../../../core/services/pannes.service';
import { AuthService } from '../../../core/services/auth';
import { environment } from '../../../../environments/environment';
import { PreventivesService } from '../../../core/services/preventives.service';
import { DemandesPollingService } from '../../../core/services/demandes-polling.service';
import { MaintenancePreventive, StatutPreventive } from '../../../core/models/maintenance-preventive.model';
import { TechnicienUI } from '../../../core/models/technicien-ui.model';
import { NotificationBellComponent } from '../../../shared/components/notification-bell/notification-bell.component';
import { Subscription, interval } from 'rxjs';

interface PieceStock {
  id: number;
  nom: string;
  stock: number;
}

interface InterventionPiece {
  pieceId: number;
  nom: string;
  quantite: number;
}


interface TechnicianProfile {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  service: string;
  department: string;
  speciality: string;
  availability: 'DISPONIBLE' | 'EN_INTERVENTION' | 'INDISPONIBLE';
}



interface Equipement {
  id: number;
  nom: string;
  type: string;
  code: string;
  lieu: string;
  imageUrl?: string; // image “catalogue” (optionnelle)
}

interface Intervention {
  id: number;
  titre: string;
  dateCreation: Date;
  statut: 'A_FAIRE' | 'EN_COURS' | 'TERMINEE' | 'ANNULEE' | 'DECLINEE';
  lieu: string;
  urgence: 'BASSE' | 'MOYENNE' | 'HAUTE';
  urgenceDemandeur?: 'BASSE' | 'MOYENNE' | 'HAUTE'; // Urgence initiale du demandeur
  description?: string; // Description complète de la panne
  typeEquipement?: string; // Type d'équipement (ex: VIDEOPROJECTEUR)
  signaleePar?: string; // Nom de la personne qui a signalé
  commentaireResponsable?: string; // Commentaire interne du responsable (lecture seule)
  noteTechnicien?: string; // Note du technicien après intervention
  pieces?: InterventionPiece[];
  imageUrl?: string; // Image de la panne jointe par le demandeur
  imageResolutionUrl?: string; // Image après résolution jointe par le technicien
  equipementId?: number; // lien vers équipement
  dateDebutIntervention?: Date; // Date de début d'intervention
  dateFinIntervention?: Date; // Date de fin d'intervention
  raisonRefus?: string; // Raison du déclin
  dateRefus?: Date; // Date du déclin
  technicienNom?: string; // Nom du technicien qui a décliné
  technicienDeclinantId?: number; // ID du technicien qui a décliné
}

interface Demande {
  id: number;
  titre: string;
  dateCreation: Date;
  statut: 'EN_ATTENTE' | 'EN_COURS' | 'RESOLUE';
  lieu: string;
  typeEquipement: string;
  description: string;
  imageUrl?: string;
  urgence: 'BASSE' | 'MOYENNE' | 'HAUTE';
}

interface NouvelleDemandeForm {
  titre: string;
  lieu: string;
  typeEquipement: string;
  typeEquipementAutre: string;
  description: string;
  imageFile: File | null;
  imagePreview: string | null;
  urgenceDemandeur: 'BASSE' | 'MOYENNE' | 'HAUTE' | null;
}

@Component({
  selector: 'app-dashboard-technicien',
  standalone: true,
  imports: [CommonModule, FormsModule, NotificationBellComponent],
  templateUrl: './dashboard-technicien.component.html',
  styleUrls: ['./dashboard-technicien.component.scss'],
})
export class DashboardTechnicienComponent implements OnInit, OnDestroy {
  @ViewChild('fileInput') fileInputRef?: ElementRef<HTMLInputElement>;
  @ViewChild('demandeFileInput') demandeFileInputRef?: ElementRef<HTMLInputElement>;

  // Nom de l’utilisateur connecté
  username = 'Technicien';
  nom = '';
  prenom = '';
  usernameInitial = 'T';

  // ===== HELP / FAQ =====
  faqOpen: boolean[] = [true, false, false];
  activeFaqIndex: number | null = null;
  toggleFaq(index: number): void {
    this.activeFaqIndex = this.activeFaqIndex === index ? null : index;
  }
  openDocumentation(): void {
    window.open('https://uasz.sn', '_blank');
  }


  // Menu utilisateur
  userMenuOpen = false;
  sidebarOpen = false;
  sidebarCollapsed = false;
  // ===== HISTORIQUE (TERMINEE) =====
  historiqueSearch = '';
  historiqueUrgence: 'TOUTES' | 'BASSE' | 'MOYENNE' | 'HAUTE' = 'TOUTES';

  historiqueFrom = ''; // format input date: yyyy-MM-dd
  historiqueTo = '';

  historiqueItemsPerPage = 5;
  historiquePage = 1;
  historiqueTotalPages = 1;
  historiqueTotalPagesArray: number[] = [];
  historiquePageStartIndex = 0;
  historiquePageEndIndex = 0;
  paginatedHistorique: Intervention[] = [];


  // Onglet actif de la sidebar
  activeItem:
    | 'dashboard'
    | 'interventions'
    | 'mes-demandes'
    | 'maintenances-preventives'
    | 'equipements'
    | 'historique'
    | 'help'
    | 'profile' = 'dashboard';


  // Filtres interventions
  statutFilter: 'TOUS' | 'A_FAIRE' | 'EN_COURS' | 'TERMINEE' | 'ANNULEE' | 'DECLINEE' = 'TOUS';
  urgenceFilter: 'TOUTES' | 'BASSE' | 'MOYENNE' | 'HAUTE' = 'TOUTES';
  searchTerm = '';

  // Pagination
  paginatedInterventions: Intervention[] = [];
  itemsPerPage = 5;
  currentPage = 1;
  totalPages = 1;
  totalPagesArray: number[] = [];
  pageStartIndex = 0;
  pageEndIndex = 0;

  // Stock de pièces (mock)
  piecesStock: PieceStock[] = [
    { id: 1, nom: 'Barrette RAM 8 Go', stock: 10 },
    { id: 2, nom: 'Disque SSD 512 Go', stock: 5 },
    { id: 3, nom: 'Câble HDMI', stock: 25 },
    { id: 4, nom: 'Cartouche toner imprimante', stock: 12 },
  ];

  // Catalogue équipements (mock)
  equipements: Equipement[] = [
    {
      id: 101,
      nom: 'PC Bureau - Labo INFO-201',
      type: 'Ordinateur',
      code: 'UASZ-PC-INFO201-01',
      lieu: 'Labo INFO-201',
      imageUrl: 'assets/equipements/pc-bureau.png',
    },
    {
      id: 102,
      nom: 'Imprimante - Bibliothèque',
      type: 'Imprimante',
      code: 'UASZ-IMP-BIBLIO-02',
      lieu: 'Bibliothèque centrale',
      imageUrl: 'assets/equipements/imprimante.png',
    },
    {
      id: 103,
      nom: 'Vidéoprojecteur - Amphi B',
      type: 'Vidéoprojecteur',
      code: 'UASZ-VP-AMPHIB-01',
      lieu: 'Amphi B',
      imageUrl: 'assets/equipements/video-projecteur.png',
    },
  ];

  // Données mockées interventions
  interventions: Intervention[] = [
    {
      id: 1,
      titre: 'Panne PC labo INFO-201',
      dateCreation: new Date('2025-11-20'),
      statut: 'A_FAIRE',
      lieu: 'Labo INFO-201',
      urgence: 'MOYENNE',
      equipementId: 101,
    },
    {
      id: 2,
      titre: 'Imprimante BIBLIO – bourrage papier',
      dateCreation: new Date('2025-11-19'),
      statut: 'EN_COURS',
      lieu: 'Bibliothèque centrale',
      urgence: 'HAUTE',
      equipementId: 102,
    },
    {
      id: 3,
      titre: 'Vidéoprojecteur Amphi B – remplacement lampe',
      dateCreation: new Date('2025-11-18'),
      statut: 'TERMINEE',
      lieu: 'Amphi B',
      urgence: 'BASSE',
      equipementId: 103,
    },
  ];

  // Stats
  aFaire = 0;
  enCours = 0;
  terminees = 0;
  annulees = 0;
  declinees = 0;

  // Modales interventions
  decisionModalOpen = false;  // modale 1 : accepter / Décliner (A_FAIRE)
  editionModalOpen = false;   // modale 2 : image + note + pièces (EN_COURS/TERMINEE)
  refuseModalOpen = false;    // modale alerte refus
  selectedIntervention: Intervention | null = null;
  
  // 🆕 Champ pour la raison du refus
  raisonRefus: string = '';


  technicienId: number | null = null;


  // Champs édition
  updateNote = '';
  imagePreview: string | null = null;
  piecesSelection: { nom: string; quantite: number | null }[] = [];
  showImageInDetails = false; // Pour afficher/masquer l'image de la panne
  showResolutionImageInDetails = false; // Pour afficher/masquer l'image de résolution
  
  // Lightbox pour agrandir l'image
  isImageLightboxOpen = false;
  lightboxImageSrc: string | null = null;

  // Image de résolution (après intervention)
  resolutionImageFile: File | null = null;
  resolutionImagePreview: string | null = null;
  resolutionImageError: string | null = null;
  @ViewChild('resolutionFileInput') resolutionFileInputRef?: ElementRef<HTMLInputElement>;

  // ===== MES DEMANDES =====
  mesDemandes: Demande[] = [];
  demandesEnAttente = 0;
  demandesEnCours = 0;
  demandesResolues = 0;

  // Filtres demandes
  demandeStatutFilter: 'TOUTES' | 'EN_ATTENTE' | 'EN_COURS' | 'RESOLUE' = 'TOUTES';
  demandeUrgenceFilter: 'TOUTES' | 'BASSE' | 'MOYENNE' | 'HAUTE' = 'TOUTES';
  demandeSearchTerm = '';

  // Pagination demandes
  demandeItemsPerPage = 5;
  demandeCurrentPage = 1;
  demandeTotalPages = 1;
  demandeTotalPagesArray: number[] = [];
  demandePageStartIndex = 0;
  demandePageEndIndex = 0;
  paginatedDemandes: Demande[] = [];

  // Modales demandes
  showNewDemandeModal = false;
  showDemandeDetailsModal = false;
  selectedDemande: Demande | null = null;
  showDemandeImageInDetails = false;

  // Formulaire nouvelle demande
  nouvelleDemande: NouvelleDemandeForm = {
    titre: '',
    lieu: '',
    typeEquipement: '',
    typeEquipementAutre: '',
    description: '',
    imageFile: null,
    imagePreview: null,
    urgenceDemandeur: null,
  };

  selectedEquipementPreset = '';
  equipementAutre = '';
  demandeImageError: string | null = null;

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

  readonly MAX_IMAGE_SIZE = 2 * 1024 * 1024; // 2 Mo
  readonly ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/jpg'];

  // Toast
  toastVisible = false;
  toastMessage = '';
  toastType: 'success' | 'danger' | 'info' = 'info';

  // Équipements (vue technicien)
  equipSearch = '';
  equipementsView: Array<Equipement & { interventionsCount: number; lastStatut?: Intervention['statut'] }> = [];
  paginatedEquipements: Array<Equipement & { interventionsCount: number; lastStatut?: Intervention['statut'] }> = [];
  equipementItemsPerPage = 5;
  equipementCurrentPage = 1;
  equipementTotalPages = 1;
  equipementTotalPagesArray: number[] = [];
  equipementPageStartIndex = 0;
  equipementPageEndIndex = 0;
  equipementModalOpen = false;
  selectedEquipement: Equipement | null = null;
  equipInterventions: Intervention[] = [];
  
  // 🔄 Subscriptions pour le polling automatique
  private pollingSubscription?: Subscription;
  private maintenancePollingSubscription?: Subscription;

constructor(
  private router: Router,
  private pannesService: PannesService,
  private authService: AuthService,
  private preventivesService: PreventivesService,
  private demandesPollingService: DemandesPollingService
) {}

ngOnInit(): void {
  // Récupérer l'ID du technicien depuis AuthService
  this.technicienId = this.authService.getUserId();

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

  // 🔄 Démarrer le polling automatique et s'abonner aux mises à jour
  if (this.technicienId) {
    // Démarrer le polling
    this.demandesPollingService.startPolling(this.technicienId, 'TECHNICIEN');
    
    // S'abonner aux interventions (mises à jour automatiques toutes les 15s)
    this.pollingSubscription = this.demandesPollingService.demandesTechnicien$.subscribe(pannes => {
      if (pannes && pannes.length >= 0) {
        this.interventions = this.mapPannesToInterventions(pannes);
        this.computeStats();
        this.applyFilters();
        this.buildEquipementsView();
        this.applyHistoriqueFilters();
      }
    });
    
    // Charger "Mes demandes" et maintenances préventives dès le départ
    this.chargerMesDemandes();
    this.chargerMaintenancesPreventives();

    // 🔄 Polling automatique pour les maintenances préventives (toutes les 15s)
    this.maintenancePollingSubscription = interval(15000).subscribe(() => {
      this.chargerMaintenancesPreventives();
    });
  } else {
    console.error('❌ Aucun ID technicien trouvé');
  }
}

ngOnDestroy(): void {
  // Arrêter le polling automatique
  if (this.pollingSubscription) {
    this.pollingSubscription.unsubscribe();
  }
  if (this.maintenancePollingSubscription) {
    this.maintenancePollingSubscription.unsubscribe();
  }
  this.demandesPollingService.stopPolling();
  
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

private chargerInterventionsDepuisApi(): void {
  if (!this.technicienId) return;

  this.pannesService.getPannesAffecteesAuTechnicien(this.technicienId)
    .subscribe({
      next: (pannes) => {
        this.interventions = this.mapPannesToInterventions(pannes);
        this.computeStats();
        this.applyFilters();
        this.buildEquipementsView();
        this.applyHistoriqueFilters();
      },
      error: (err) => {
        console.error('Erreur chargement pannes technicien:', err);
        this.showToast('Erreur lors du chargement des interventions', 'danger');
      }
    });
}

private mapPannesToInterventions(pannes: any[]): Intervention[] {
  return pannes.map(p => ({
    id: p.id,
    titre: p.titre,
    description: p.description,
    dateCreation: new Date(p.dateSignalement || p.dateCreation),
    statut: this.mapStatutInterventionApiToUi(
      p.statutInterventions, 
      p.statut, 
      p.technicien?.id || p.technicienId, 
      p.technicienDeclinant?.id || p.technicienDeclinantId
    ),
    lieu: p.lieu,
    typeEquipement: p.typeEquipement,
    signaleePar: p.signaleePar,
    urgence: this.mapPrioriteToUrgence(p.prioriteResponsable || p.priorite),
    commentaireResponsable: p.commentaireInterne,
    noteTechnicien: p.noteTechnicien,
    pieces: this.parsePiecesUtilisees(p.piecesUtilisees),
    imageUrl: p.imagePath,
    imageResolutionUrl: p.imageResolutionPath,
    equipementId: p.equipement?.id,
    dateDebutIntervention: p.dateDebutIntervention ? new Date(p.dateDebutIntervention) : undefined,
    dateFinIntervention: p.dateFinIntervention ? new Date(p.dateFinIntervention) : undefined,
    raisonRefus: p.raisonRefus,
    dateRefus: p.dateRefus ? new Date(p.dateRefus) : undefined,
    technicienNom: p.technicienDeclinantNom || p.technicienNom || (p.technicien ? `${p.technicien.prenom || ''} ${p.technicien.nom || ''}`.trim() : ''),
    technicienDeclinantId: p.technicienDeclinant?.id || p.technicienDeclinantId
  }));
}

private parsePiecesUtilisees(piecesJson: string | null): InterventionPiece[] {
  if (!piecesJson) return [];
  try {
    const pieces = JSON.parse(piecesJson);
    return pieces.map((p: any) => ({
      pieceId: 0,
      nom: p.nom,
      quantite: p.quantite
    }));
  } catch (e) {
    console.error('Erreur parsing pièces:', e);
    return [];
  }
}

private mapStatutInterventionApiToUi(
  statutInterventions: string, 
  statutPanne: string, 
  technicienId: number, 
  technicienDeclinantId: number | null
): 'A_FAIRE' | 'EN_COURS' | 'TERMINEE' | 'DECLINEE' {
  // Si la panne est marquée comme RESOLUE par le responsable, afficher TERMINEE
  if (statutPanne === 'RESOLUE') return 'TERMINEE';
  
  // Si je suis le technicien qui a décliné (technicienDeclinantId === moi)
  // ET que je ne suis PLUS le technicien affecté (technicienId !== moi)
  // Alors afficher DECLINEE (même si le statut a changé après réaffectation)
  if (technicienDeclinantId && technicienDeclinantId === this.technicienId && technicienId !== this.technicienId) {
    return 'DECLINEE';
  }
  
  // Si la demande est actuellement déclinée ET c'est moi qui l'ai déclinée
  if (statutInterventions === 'DECLINEE' && technicienDeclinantId === this.technicienId) {
    return 'DECLINEE';
  }
  
  // Si statutInterventions === 'DECLINEE' mais ce n'est PAS moi qui ai décliné
  // Cela signifie que c'est une demande réaffectée, donc ignorer le statut DECLINEE
  // et utiliser le statut réel (NON_DEMARREE après réaffectation)
  
  // Sinon, utiliser le statut de l'intervention
  if (statutInterventions === 'NON_DEMARREE') return 'A_FAIRE';
  if (statutInterventions === 'EN_COURS') return 'EN_COURS';
  if (statutInterventions === 'TERMINEE') return 'TERMINEE';
  
  console.log('  → Retourne A_FAIRE (par défaut)');
  // Ne retourner DECLINEE que si on n'a pas déjà géré ce cas ci-dessus
  // (ce qui signifie que c'est une erreur de données)
  return 'A_FAIRE';
}

private mapPrioriteToUrgence(priorite: string): 'BASSE' | 'MOYENNE' | 'HAUTE' {
  if (priorite === 'BASSE') return 'BASSE';
  if (priorite === 'HAUTE') return 'HAUTE';
  return 'MOYENNE';
}

  // ===== PROFIL =====
  profile: TechnicianProfile = {
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    service: '',
    department: '',
    speciality: '',
    availability: 'DISPONIBLE',
  };

  profileDraft: TechnicianProfile = { ...this.profile };
  profileSavedMsg = '';
  profileSavedMsgType: 'success' | 'error' | 'warn' = 'success';

// ===== PASSWORD (UI only) =====
  passwordForm = {
    current: '',
    new: '',
    confirm: '',
  };
  passwordMsg = '';
  passwordMsgType: 'success' | 'error' | 'warn' = 'warn';

  // Visibilité des mots de passe
  showCurrentPassword = false;
  showNewPassword = false;
  showConfirmPassword = false;


  /* ======================= SIDEBAR ======================= */

  setActive(
    item:
      | 'dashboard'
      | 'interventions'
      | 'mes-demandes'
      | 'maintenances-preventives'
      | 'equipements'
      | 'historique'
      | 'help'
  ) {
    this.activeItem = item;
    this.closeUserMenu();
    this.sidebarOpen = false;

    // Petit confort UX : quand on entre dans équipements, on construit la vue
    if (item === 'equipements') {
      this.buildEquipementsView();
    }
    if (item === 'historique') {
      this.applyHistoriqueFilters();
    }
    if (item === 'mes-demandes') {
      this.applyDemandeFilters();
    }
    if (item === 'maintenances-preventives') {
      this.chargerMaintenancesPreventives();
    }
  }

  /* ======================= USER MENU ===================== */

  toggleUserMenu(): void {
    this.userMenuOpen = !this.userMenuOpen;
  }

  goToDashboard(): void {
    this.activeItem = 'dashboard';
    this.userMenuOpen = false;
  }

  /* ======================= LOGOUT MODAL ========================= */

  showLogoutModal = false;

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

  /* ======================= STATS ========================= */

  private computeStats(): void {
    this.aFaire = this.interventions.filter((i) => i.statut === 'A_FAIRE').length;
    this.enCours = this.interventions.filter((i) => i.statut === 'EN_COURS').length;
    this.terminees = this.interventions.filter((i) => i.statut === 'TERMINEE').length;
    this.annulees = this.interventions.filter((i) => i.statut === 'ANNULEE').length;
    this.declinees = this.interventions.filter((i) => i.statut === 'DECLINEE').length;
  }

  /* =================== FILTRES + RECHERCHE (INTERV) ====== */

  setStatutFilter(filter: 'TOUS' | 'A_FAIRE' | 'EN_COURS' | 'TERMINEE' | 'ANNULEE' | 'DECLINEE') {
    this.statutFilter = filter;
    this.currentPage = 1;
    this.applyFilters();
  }

  setUrgenceFilter(filter: 'TOUTES' | 'BASSE' | 'MOYENNE' | 'HAUTE') {
    this.urgenceFilter = filter;
    this.currentPage = 1;
    this.applyFilters();
  }

  applyFilters(): void {
    const term = this.searchTerm.trim().toLowerCase();

    const filtered = this.interventions.filter((i) => {
      const matchStatut =
        this.statutFilter === 'TOUS' ? true : i.statut === this.statutFilter;

      const matchUrgence =
        this.urgenceFilter === 'TOUTES' ? true : i.urgence === this.urgenceFilter;

      const matchSearch =
        term.length === 0
          ? true
          : ((i.titre || '').toLowerCase().includes(term) || (i.lieu || '').toLowerCase().includes(term));

      return matchStatut && matchUrgence && matchSearch;
    });

    // Tri : A_FAIRE en haut, EN_COURS au milieu, TERMINEE en bas, ANNULEE et DECLINEE à la fin
    // Au sein de chaque groupe, les plus récentes en haut
    const sorted = filtered.sort((a, b) => {
      // Ordre de priorité des statuts
      const statutOrder = { 'A_FAIRE': 1, 'EN_COURS': 2, 'TERMINEE': 3, 'ANNULEE': 4, 'DECLINEE': 5 };
      const orderA = statutOrder[a.statut] || 999;
      const orderB = statutOrder[b.statut] || 999;

      // Si statuts différents, trier par statut
      if (orderA !== orderB) {
        return orderA - orderB;
      }

      // Si même statut, trier par date (plus récentes en haut)
      return b.dateCreation.getTime() - a.dateCreation.getTime();
    });

    const total = sorted.length;
    this.totalPages = Math.max(1, Math.ceil(total / this.itemsPerPage));
    this.totalPagesArray = Array.from({ length: this.totalPages }, (_, i) => i + 1);

    const start = (this.currentPage - 1) * this.itemsPerPage;
    const end = Math.min(start + this.itemsPerPage, total);

    this.pageStartIndex = total === 0 ? 0 : start + 1;
    this.pageEndIndex = end;

    this.paginatedInterventions = sorted.slice(start, end);
  }

  /* ======================= PAGINATION ==================== */

  goToPage(page: number) {
    if (page < 1 || page > this.totalPages) return;
    this.currentPage = page;
    this.applyFilters();
  }

  getVisibleInterventionsPages(): (number | string)[] {
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
  goToProfile(): void {
    this.userMenuOpen = false;
    this.activeItem = 'profile';
  }

  resetProfileDraft(): void {
    this.profileDraft = { ...this.profile };
  }

  saveProfileV2(): void {
    this.profile = { ...this.profileDraft };
    localStorage.setItem('tech_profile_v2', JSON.stringify(this.profile));

    this.profileSavedMsg = 'Informations enregistrées avec succès.';
    setTimeout(() => (this.profileSavedMsg = ''), 3000);
  }

  canChangePassword(): boolean {
    return (
      this.passwordForm.current.trim().length > 0 &&
      this.passwordForm.new.trim().length >= 8 &&
      this.passwordForm.new === this.passwordForm.confirm
    );
  }

  changePassword(): void {
    // Validation
    if (!this.passwordForm.current) {
      this.passwordMsg = 'Veuillez saisir votre mot de passe actuel';
      this.passwordMsgType = 'warn';
      setTimeout(() => (this.passwordMsg = ''), 3000);
      return;
    }
    if (!this.passwordForm.new) {
      this.passwordMsg = 'Veuillez saisir un nouveau mot de passe';
      this.passwordMsgType = 'warn';
      setTimeout(() => (this.passwordMsg = ''), 3000);
      return;
    }
    if (this.passwordForm.new.length < 8) {
      this.passwordMsg = 'Le mot de passe doit contenir au moins 8 caractères';
      this.passwordMsgType = 'warn';
      setTimeout(() => (this.passwordMsg = ''), 3000);
      return;
    }
    if (this.passwordForm.new !== this.passwordForm.confirm) {
      this.passwordMsg = 'Les mots de passe ne correspondent pas';
      this.passwordMsgType = 'warn';
      setTimeout(() => (this.passwordMsg = ''), 3000);
      return;
    }

    // Appeler l'API pour changer le mot de passe
    this.authService.changePassword(
      this.passwordForm.current,
      this.passwordForm.new
    ).subscribe({
      next: (response: any) => {
        this.passwordMsg = 'Mot de passe mis à jour avec succès';
        this.passwordMsgType = 'success';
        setTimeout(() => (this.passwordMsg = ''), 3000);
        
        // Réinitialiser le formulaire
        this.passwordForm = { current: '', new: '', confirm: '' };
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
        
        this.passwordMsg = errorMessage;
        this.passwordMsgType = 'error';
        setTimeout(() => (this.passwordMsg = ''), 4000);
      }
    });
  }


  /* ======================= MODALES (INTERV) ============== */

  // Helper pour savoir si on doit afficher les infos de déclin
  shouldShowDeclineInfo(intervention: Intervention): boolean {
    // Afficher les infos de déclin seulement si:
    // 1. Le statut est DECLINEE
    // 2. ET c'est MOI qui ai décliné (technicienDeclinantId === mon ID)
    return intervention.statut === 'DECLINEE' && 
           intervention.technicienDeclinantId === this.technicienId;
  }

  openDetails(intervention: Intervention) {
    this.selectedIntervention = intervention;

    if (intervention.statut === 'A_FAIRE' || intervention.statut === 'DECLINEE') {
      // Pour "À faire" et "Déclinée" : ouvrir la modale de décision/détails
      this.decisionModalOpen = true;
      this.editionModalOpen = false;
      this.refuseModalOpen = false;
    } else {
      // Pour "En cours" et "Terminée" : ouvrir la modale d'édition
      this.prepareEditionModal(intervention);
    }
  }

  private prepareEditionModal(intervention: Intervention) {
    this.selectedIntervention = intervention;
    
    // Charger la note existante si elle existe, sinon vide
    this.updateNote = intervention.noteTechnicien || '';
    this.imagePreview = intervention.imageUrl || null;

    // Charger les pièces existantes si elles existent
    if (intervention.pieces && intervention.pieces.length > 0) {
      this.piecesSelection = intervention.pieces.map((p) => ({
        nom: p.nom,
        quantite: p.quantite,
      }));
    } else {
      this.piecesSelection = [{ nom: '', quantite: null }];
    }

    if (this.fileInputRef?.nativeElement) {
      this.fileInputRef.nativeElement.value = '';
    }

    this.decisionModalOpen = false;
    this.refuseModalOpen = false;
    this.editionModalOpen = true;
  }

  closeModals() {
    this.decisionModalOpen = false;
    this.editionModalOpen = false;
    this.refuseModalOpen = false;
    this.equipementModalOpen = false;
    this.showNewDemandeModal = false;
    this.unlockBodyScroll();
    this.showDemandeDetailsModal = false;
    this.unlockBodyScroll();
    this.showMaintenanceDetailsModal = false;
    this.unlockBodyScroll();

    this.selectedIntervention = null;
    this.imagePreview = null;
    this.piecesSelection = [];
    this.showImageInDetails = false; // Réinitialiser l'affichage de l'image
    this.showResolutionImageInDetails = false;
    this.resolutionImageFile = null;
    this.resolutionImagePreview = null;
    this.resolutionImageError = null;
    if (this.resolutionFileInputRef?.nativeElement) {
      this.resolutionFileInputRef.nativeElement.value = '';
    }

    this.selectedEquipement = null;
    this.equipInterventions = [];

    this.selectedDemande = null;
    this.showDemandeImageInDetails = false;

    this.selectedMaintenance = null;

    if (this.fileInputRef?.nativeElement) {
      this.fileInputRef.nativeElement.value = '';
    }
  }

  /* ====== MODALE 1 : ACCEPTER / Décliner ================== */

  accepterIntervention() {
    if (!this.selectedIntervention || !this.technicienId) return;

    const panneId = this.selectedIntervention.id;

    // Appeler le backend pour démarrer l'intervention
    this.pannesService.demarrerIntervention(panneId).subscribe({
      next: () => {
        this.showToast('Intervention acceptée et passée en cours de traitement.', 'success');
        
        // Fermer la modale de décision
        this.decisionModalOpen = false;

        // Recharger les données depuis le backend
        this.chargerInterventionsDepuisApi();
      },
      error: (err) => {
        console.error('Erreur lors de l\'acceptation de l\'intervention:', err);
        this.showToast('Erreur lors de l\'acceptation de l\'intervention', 'danger');
      }
    });
  }

  refuserIntervention() {
    if (!this.selectedIntervention) return;

    // On ferme la modale décision et on ouvre la modale d'alerte
    this.decisionModalOpen = false;
    this.raisonRefus = ''; // Réinitialiser la raison
    this.refuseModalOpen = true;
  }

  cancelRefuse() {
    this.refuseModalOpen = false;
    this.raisonRefus = '';
  }

  confirmRefuse() {
    if (!this.selectedIntervention || !this.technicienId) return;
    
    // Validation de la raison
    if (!this.raisonRefus || this.raisonRefus.trim().length < 10) {
      this.showToast('Veuillez fournir une raison détaillée (minimum 10 caractères)', 'danger');
      return;
    }

    const panneId = this.selectedIntervention.id;
    const titre = this.selectedIntervention.titre;

    // Appel backend pour décliner l'intervention
    this.pannesService.refuserIntervention(panneId, this.raisonRefus).subscribe({
      next: () => {
        this.showToast(`Intervention déclinée : « ${titre} ».`, 'success');
        this.closeModals();
        this.raisonRefus = '';
        // Recharger les interventions
        this.chargerInterventionsDepuisApi();
      },
      error: (err) => {
        console.error('Erreur lors du déclin:', err);
        this.showToast('Erreur lors du déclin de l\'intervention', 'danger');
      }
    });
  }

  /* ====== MODALE 2 : IMAGE / NOTE / PIECES ================ */

  onImageSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    const file = input.files[0];
    const reader = new FileReader();
    reader.onload = () => {
      this.imagePreview = reader.result as string;
    };
    reader.readAsDataURL(file);
  }

  clearImage(event?: Event) {
    if (event) event.stopPropagation();
    this.imagePreview = null;

    if (this.fileInputRef?.nativeElement) {
      this.fileInputRef.nativeElement.value = '';
    }
  }

  addPieceRow() {
    this.piecesSelection.push({ nom: '', quantite: null });
  }

  removePieceRow(index: number) {
    this.piecesSelection.splice(index, 1);
    if (this.piecesSelection.length === 0) {
      this.piecesSelection.push({ nom: '', quantite: null });
    }
  }

  validateQuantity(sel: { nom: string; quantite: number | null }) {
    if (sel.quantite !== null) {
      // Empêcher les valeurs négatives et 0
      if (sel.quantite < 1) {
        sel.quantite = 1;
      }
      // Arrondir à l'entier le plus proche (pas de décimales)
      sel.quantite = Math.round(sel.quantite);
    }
  }

  private buildPiecesFromSelection(): InterventionPiece[] {
    return this.piecesSelection
      .filter((sel) => sel.nom.trim() && sel.quantite && sel.quantite > 0)
      .map((sel) => ({
        pieceId: 0, // Pas d'ID car saisie manuelle
        nom: sel.nom.trim(),
        quantite: sel.quantite as number,
      }));
  }

  onResolutionImageSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    const file = input.files[0];

    if (!this.ALLOWED_IMAGE_TYPES.includes(file.type)) {
      this.resolutionImageError = 'Format non autorisé. Choisissez une image JPG ou PNG.';
      return;
    }

    if (file.size > this.MAX_IMAGE_SIZE) {
      this.resolutionImageError = 'Image trop volumineuse (max 2 Mo).';
      return;
    }

    this.resolutionImageError = null;
    this.resolutionImageFile = file;

    const reader = new FileReader();
    reader.onload = () => {
      this.resolutionImagePreview = reader.result as string;
    };
    reader.readAsDataURL(file);
  }

  removeResolutionImage(): void {
    this.resolutionImageFile = null;
    this.resolutionImagePreview = null;
    this.resolutionImageError = null;
    if (this.resolutionFileInputRef?.nativeElement) {
      this.resolutionFileInputRef.nativeElement.value = '';
    }
  }

  terminerIntervention() {
    if (!this.selectedIntervention || !this.updateNote.trim() || !this.technicienId) return;

    const panneId = this.selectedIntervention.id;
    const pieces = this.buildPiecesFromSelection();

    this.pannesService.terminerIntervention(panneId, this.updateNote.trim(), pieces, this.resolutionImageFile).subscribe({
      next: () => {
        if (this.selectedIntervention) {
          this.selectedIntervention.statut = 'TERMINEE';
          this.selectedIntervention.pieces = pieces;
        }

        this.computeStats();
        this.applyFilters();
        this.closeModals();
        this.showToast('Intervention terminée avec succès.', 'success');

        this.chargerInterventionsDepuisApi();
      },
      error: (err) => {
        console.error('Erreur lors de la terminaison de l\'intervention:', err);
        this.showToast('Erreur lors de la terminaison de l\'intervention', 'danger');
      }
    });
  }

  applyHistoriqueFilters(): void {
    const term = this.historiqueSearch.trim().toLowerCase();

    const fromDate = this.historiqueFrom ? new Date(this.historiqueFrom) : null;
    const toDate = this.historiqueTo ? new Date(this.historiqueTo) : null;

    // pour inclure toute la journée "to"
    if (toDate) {
      toDate.setHours(23, 59, 59, 999);
    }

    const filtered = this.interventions
      .filter(i => i.statut === 'TERMINEE')
      .filter(i => {
        const matchUrgence =
          this.historiqueUrgence === 'TOUTES'
            ? true
            : i.urgence === this.historiqueUrgence;

        const matchSearch =
          term.length === 0
            ? true
            : ((i.titre || '').toLowerCase().includes(term) || (i.lieu || '').toLowerCase().includes(term));

        const matchFrom = fromDate ? i.dateCreation >= fromDate : true;
        const matchTo = toDate ? i.dateCreation <= toDate : true;

        return matchUrgence && matchSearch && matchFrom && matchTo;
      })
      .sort((a, b) => b.dateCreation.getTime() - a.dateCreation.getTime());

    const total = filtered.length;
    this.historiqueTotalPages = Math.max(1, Math.ceil(total / this.historiqueItemsPerPage));
    this.historiqueTotalPagesArray = Array.from({ length: this.historiqueTotalPages }, (_, i) => i + 1);

    const start = (this.historiquePage - 1) * this.historiqueItemsPerPage;
    const end = Math.min(start + this.historiqueItemsPerPage, total);

    this.historiquePageStartIndex = total === 0 ? 0 : start + 1;
    this.historiquePageEndIndex = end;

    this.paginatedHistorique = filtered.slice(start, end);
  }

  setHistoriqueUrgence(filter: 'TOUTES' | 'BASSE' | 'MOYENNE' | 'HAUTE') {
    this.historiqueUrgence = filter;
    this.historiquePage = 1;
    this.applyHistoriqueFilters();
  }

  goToHistoriquePage(page: number) {
    if (page < 1 || page > this.historiqueTotalPages) return;
    this.historiquePage = page;
    this.applyHistoriqueFilters();
  }

  getVisibleHistoriquePages(): (number | string)[] {
    const maxVisible = 7;
    const pages: (number | string)[] = [];
    
    if (this.historiqueTotalPages <= maxVisible) {
      for (let i = 1; i <= this.historiqueTotalPages; i++) {
        pages.push(i);
      }
    } else {
      pages.push(1);
      
      let startPage: number;
      let endPage: number;
      
      if (this.historiquePage <= 4) {
        startPage = 2;
        endPage = 6;
      } else if (this.historiquePage >= this.historiqueTotalPages - 3) {
        startPage = this.historiqueTotalPages - 5;
        endPage = this.historiqueTotalPages - 1;
      } else {
        startPage = this.historiquePage - 2;
        endPage = this.historiquePage + 2;
      }
      
      if (startPage > 2) {
        pages.push('...');
      }
      
      for (let i = startPage; i <= endPage; i++) {
        pages.push(i);
      }
      
      if (endPage < this.historiqueTotalPages - 1) {
        pages.push('...');
      }
      
      pages.push(this.historiqueTotalPages);
    }
    
    return pages;
  }

  getTotalTerminees(): number {
    return this.interventions.filter(i => i.statut === 'TERMINEE').length;
  }

  /* ======================= TOAST ========================= */

  private showToast(message: string, type: 'success' | 'danger' | 'info' = 'info') {
    this.toastMessage = message;
    this.toastType = type;
    this.toastVisible = true;

    setTimeout(() => {
      this.toastVisible = false;
    }, 3000);
  }

  /* ======================= EQUIPEMENTS =================== */

  private buildEquipementsView() {
    // Créer une vue des équipements basée sur les pannes du technicien
    // Grouper par typeEquipement + lieu pour créer des "équipements virtuels"
    
    const equipementMap = new Map<string, {
      typeEquipement: string;
      lieu: string;
      interventions: Intervention[];
    }>();

    // Grouper les interventions par type d'équipement et lieu
    this.interventions.forEach((i) => {
      const type = i.typeEquipement || 'Équipement non spécifié';
      const lieu = i.lieu || 'Lieu non spécifié';
      const key = `${type}|${lieu}`;

      if (!equipementMap.has(key)) {
        equipementMap.set(key, {
          typeEquipement: type,
          lieu: lieu,
          interventions: []
        });
      }

      equipementMap.get(key)!.interventions.push(i);
    });

    // Convertir en tableau pour l'affichage
    const allEquipements = Array.from(equipementMap.values()).map((eq, index) => {
      const sorted = eq.interventions.sort((a, b) => 
        b.dateCreation.getTime() - a.dateCreation.getTime()
      );

      return {
        id: index + 1,
        nom: `${eq.typeEquipement} - ${eq.lieu}`,
        type: eq.typeEquipement,
        code: `EQ-${(index + 1).toString().padStart(3, '0')}`,
        lieu: eq.lieu,
        interventionsCount: eq.interventions.length,
        lastStatut: sorted[0]?.statut,
        imageUrl: sorted[0]?.imageUrl, // Utiliser l'image de la panne la plus récente
      };
    });

    // Appliquer la recherche
    const term = this.equipSearch.trim().toLowerCase();
    this.equipementsView = term.length === 0
      ? allEquipements
      : allEquipements.filter((e) =>
        (e.nom || '').toLowerCase().includes(term) ||
        (e.type || '').toLowerCase().includes(term) ||
        (e.code || '').toLowerCase().includes(term) ||
        (e.lieu || '').toLowerCase().includes(term)
      );
    
    // Appliquer la pagination
    this.applyEquipementPagination();
  }

  applyEquipementPagination() {
    this.equipementTotalPages = Math.ceil(this.equipementsView.length / this.equipementItemsPerPage);
    this.equipementTotalPagesArray = Array.from({ length: this.equipementTotalPages }, (_, i) => i + 1);
    
    if (this.equipementCurrentPage > this.equipementTotalPages && this.equipementTotalPages > 0) {
      this.equipementCurrentPage = 1;
    }
    
    this.equipementPageStartIndex = (this.equipementCurrentPage - 1) * this.equipementItemsPerPage;
    this.equipementPageEndIndex = Math.min(
      this.equipementPageStartIndex + this.equipementItemsPerPage,
      this.equipementsView.length
    );
    
    this.paginatedEquipements = this.equipementsView.slice(
      this.equipementPageStartIndex,
      this.equipementPageEndIndex
    );
  }

  goToEquipementPage(page: number) {
    if (page >= 1 && page <= this.equipementTotalPages) {
      this.equipementCurrentPage = page;
      this.applyEquipementPagination();
    }
  }

  getVisibleEquipementsPages(): (number | string)[] {
    const maxVisible = 7;
    const pages: (number | string)[] = [];
    
    if (this.equipementTotalPages <= maxVisible) {
      for (let i = 1; i <= this.equipementTotalPages; i++) {
        pages.push(i);
      }
    } else {
      pages.push(1);
      
      let startPage: number;
      let endPage: number;
      
      if (this.equipementCurrentPage <= 4) {
        startPage = 2;
        endPage = 6;
      } else if (this.equipementCurrentPage >= this.equipementTotalPages - 3) {
        startPage = this.equipementTotalPages - 5;
        endPage = this.equipementTotalPages - 1;
      } else {
        startPage = this.equipementCurrentPage - 2;
        endPage = this.equipementCurrentPage + 2;
      }
      
      if (startPage > 2) {
        pages.push('...');
      }
      
      for (let i = startPage; i <= endPage; i++) {
        pages.push(i);
      }
      
      if (endPage < this.equipementTotalPages - 1) {
        pages.push('...');
      }
      
      pages.push(this.equipementTotalPages);
    }
    
    return pages;
  }

  onEquipSearchChange() {
    this.buildEquipementsView();
  }

  openEquipementDetails(e: any) {
    this.selectedEquipement = e;
    
    // Trouver toutes les interventions pour cet équipement (même type + lieu)
    this.equipInterventions = this.interventions
      .filter((i) => 
        (i.typeEquipement || 'Équipement non spécifié') === e.type &&
        (i.lieu || 'Lieu non spécifié') === e.lieu
      )
      .sort((a, b) => b.dateCreation.getTime() - a.dateCreation.getTime());

    this.equipementModalOpen = true;
  }

  getEquipStatCount(statut: 'A_FAIRE' | 'EN_COURS' | 'TERMINEE'): number {
    return this.equipInterventions.filter(i => i.statut === statut).length;
  }

  closeUserMenu(): void {
    this.userMenuOpen = false;
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
  onEscapeKey(): void {
    if (this.isImageLightboxOpen) {
      this.closeImageLightbox();
    }
  }

  /* ======================= MES DEMANDES =================== */

  private chargerMesDemandes(): void {
    // 🔄 S'abonner aux "Mes demandes" avec polling automatique
    this.demandesPollingService.mesDemandes$.subscribe({
      next: (pannes) => {
        if (pannes && pannes.length >= 0) {
          this.mesDemandes = pannes.map(p => this.mapPanneToDemande(p));
          this.computeDemandesStats();
          this.applyDemandeFilters();
        }
      },
      error: (err) => {
        console.error('Erreur chargement mes demandes:', err);
      }
    });
  }

  private mapPanneToDemande(p: any): Demande {
    const statutUi: 'EN_ATTENTE' | 'EN_COURS' | 'RESOLUE' =
      p.statut === 'OUVERTE' ? 'EN_ATTENTE' : p.statut === 'EN_COURS' ? 'EN_COURS' : 'RESOLUE';

    const urgenceUi: 'BASSE' | 'MOYENNE' | 'HAUTE' =
      p.priorite === 'HAUTE' ? 'HAUTE' : p.priorite === 'MOYENNE' ? 'MOYENNE' : 'BASSE';

    const baseUrl = environment.backendUrl;
    const imageUrl = p.imagePath ? `${baseUrl}${p.imagePath}` : undefined;

    return {
      id: p.id,
      titre: p.titre,
      dateCreation: new Date(p.dateSignalement),
      statut: statutUi,
      lieu: p.lieu || 'Non spécifié',
      typeEquipement: p.typeEquipement || 'Équipement',
      description: p.description || '',
      imageUrl,
      urgence: urgenceUi,
    };
  }

  private computeDemandesStats(): void {
    this.demandesEnAttente = this.mesDemandes.filter(d => d.statut === 'EN_ATTENTE').length;
    this.demandesEnCours = this.mesDemandes.filter(d => d.statut === 'EN_COURS').length;
    this.demandesResolues = this.mesDemandes.filter(d => d.statut === 'RESOLUE').length;
  }

  setDemandeStatutFilter(filter: 'TOUTES' | 'EN_ATTENTE' | 'EN_COURS' | 'RESOLUE') {
    this.demandeStatutFilter = filter;
    this.demandeCurrentPage = 1;
    this.applyDemandeFilters();
  }

  setDemandeUrgenceFilter(filter: 'TOUTES' | 'BASSE' | 'MOYENNE' | 'HAUTE') {
    this.demandeUrgenceFilter = filter;
    this.demandeCurrentPage = 1;
    this.applyDemandeFilters();
  }

  get filteredDemandes(): Demande[] {
    const term = this.demandeSearchTerm.trim().toLowerCase();

    return this.mesDemandes.filter((d) => {
      const matchStatut =
        this.demandeStatutFilter === 'TOUTES' ? true : d.statut === this.demandeStatutFilter;

      const matchUrgence =
        this.demandeUrgenceFilter === 'TOUTES' ? true : d.urgence === this.demandeUrgenceFilter;

      const matchSearch =
        term.length === 0
          ? true
          : ((d.titre || '').toLowerCase().includes(term) || 
             (d.lieu || '').toLowerCase().includes(term) || 
             (d.typeEquipement || '').toLowerCase().includes(term));

      return matchStatut && matchUrgence && matchSearch;
    });
  }

  applyDemandeFilters(): void {
    const filtered = this.filteredDemandes;

    const total = filtered.length;
    this.demandeTotalPages = Math.max(1, Math.ceil(total / this.demandeItemsPerPage));
    this.demandeTotalPagesArray = Array.from({ length: this.demandeTotalPages }, (_, i) => i + 1);

    const start = (this.demandeCurrentPage - 1) * this.demandeItemsPerPage;
    const end = Math.min(start + this.demandeItemsPerPage, total);

    this.demandePageStartIndex = total === 0 ? 0 : start + 1;
    this.demandePageEndIndex = end;

    this.paginatedDemandes = filtered.slice(start, end);
  }

  goToDemandesPage(page: number) {
    if (page < 1 || page > this.demandeTotalPages) return;
    this.demandeCurrentPage = page;
    this.applyDemandeFilters();
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
    this.resetNouvelleDemandeForm();
    this.showNewDemandeModal = true;
    this.lockBodyScroll();
  }

  private resetNouvelleDemandeForm(): void {
    this.nouvelleDemande = {
      titre: '',
      lieu: '',
      typeEquipement: '',
      typeEquipementAutre: '',
      description: '',
      imageFile: null,
      imagePreview: null,
      urgenceDemandeur: null,
    };
    this.selectedEquipementPreset = '';
    this.equipementAutre = '';
    this.demandeImageError = null;
  }

  onEquipementPresetChange(): void {
    if (this.selectedEquipementPreset !== 'AUTRE') {
      this.equipementAutre = '';
    }
  }

  onDemandeImageSelected(e: Event): void {
    const input = e.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    const file = input.files[0];

    if (!this.ALLOWED_IMAGE_TYPES.includes(file.type)) {
      this.demandeImageError = 'Format d\'image non autorisé. Veuillez choisir une image JPG ou PNG.';
      this.nouvelleDemande.imageFile = null;
      this.nouvelleDemande.imagePreview = null;
      return;
    }

    if (file.size > this.MAX_IMAGE_SIZE) {
      this.demandeImageError = 'Image trop volumineuse. La taille maximale autorisée est de 2 Mo.';
      this.nouvelleDemande.imageFile = null;
      this.nouvelleDemande.imagePreview = null;
      return;
    }

    this.demandeImageError = null;
    this.nouvelleDemande.imageFile = file;

    const reader = new FileReader();
    reader.onload = () => {
      this.nouvelleDemande.imagePreview = reader.result as string;
    };
    reader.readAsDataURL(file);
  }

  removeDemandeImage(): void {
    this.nouvelleDemande.imageFile = null;
    this.nouvelleDemande.imagePreview = null;
    this.demandeImageError = null;
  }

  isNouvelleDemandeValid(): boolean {
    const titreOk = !!this.nouvelleDemande.titre?.trim();
    const lieuOk = !!this.nouvelleDemande.lieu?.trim();
    const urgenceOk = !!this.nouvelleDemande.urgenceDemandeur;

    const equipementOk =
      !!this.selectedEquipementPreset &&
      (this.selectedEquipementPreset !== 'AUTRE' || !!this.equipementAutre?.trim());

    const imageOk = !!this.nouvelleDemande.imageFile;

    return titreOk && lieuOk && urgenceOk && equipementOk && imageOk;
  }

  submitNouvelleDemande(): void {
    if (!this.isNouvelleDemandeValid()) return;

    const selected = this.selectedEquipementPreset.trim();
    const isAutre = selected === 'AUTRE';
    const autreValue = this.equipementAutre.trim();

    const typeEquipementFinal = isAutre
      ? `AUTRE: ${autreValue || 'Non précisé'}`
      : selected;

    let descriptionFinale = this.nouvelleDemande.description;
    if (isAutre) {
      descriptionFinale = `[Équipement non référencé] ${autreValue || 'Non précisé'}\n\n${this.nouvelleDemande.description}`;
    }

    const fd = new FormData();
    fd.append('titre', this.nouvelleDemande.titre);
    fd.append('description', descriptionFinale);
    fd.append('lieu', this.nouvelleDemande.lieu);
    fd.append('typeEquipement', typeEquipementFinal);
    fd.append('priorite', this.nouvelleDemande.urgenceDemandeur!);
    fd.append('signaleePar', this.username);

    if (this.nouvelleDemande.imageFile) {
      fd.append('image', this.nouvelleDemande.imageFile);
    }

    this.pannesService.createPanne(fd).subscribe({
      next: (createdApi) => {
        const createdDemande = this.mapPanneToDemande(createdApi);
        this.mesDemandes.unshift(createdDemande);
        this.computeDemandesStats();
        this.applyDemandeFilters();

        this.closeModals();
        this.showToast('Votre demande a été créée avec succès !', 'success');
      },
      error: (err) => {
        console.error('Erreur création demande:', err);
        if (err.status === 413) {
          this.demandeImageError = 'L\'image sélectionnée est trop volumineuse. Veuillez choisir une image de moins de 2 Mo.';
        } else {
          this.showToast('Erreur lors de la création de la demande', 'danger');
        }
      },
    });
  }

  openDemandeDetails(d: Demande): void {
    this.selectedDemande = d;
    this.showDemandeDetailsModal = true;
    this.lockBodyScroll();
    this.showDemandeImageInDetails = false;
  }

  /* ======================= MAINTENANCES PRÉVENTIVES =================== */
  
  maintenancesPreventives: MaintenancePreventive[] = [];
  maintenancesFiltered: MaintenancePreventive[] = [];
  maintenancesPaginated: MaintenancePreventive[] = [];
  
  maintenanceStatutFilter: 'TOUTES' | StatutPreventive = 'TOUTES';
  maintenanceSearchTerm = '';
  
  maintenanceCurrentPage = 1;
  maintenanceItemsPerPage = 5;
  maintenanceTotalPages = 1;
  maintenanceTotalPagesArray: number[] = [];
  maintenancePageStartIndex = 0;
  maintenancePageEndIndex = 0;

  // Modale détails maintenance
  showMaintenanceDetailsModal = false;
  selectedMaintenance: MaintenancePreventive | null = null;
  
  // Formulaire de réalisation
  maintenanceRapport = '';
  maintenancePiecesSelection: { nom: string; quantite: number | null }[] = [{ nom: '', quantite: null }];

  private chargerMaintenancesPreventives(): void {
    this.preventivesService.getAll().subscribe({
      next: (maintenances) => {
        this.maintenancesPreventives = this.technicienId
          ? maintenances.filter(m => m.technicienId === this.technicienId)
          : maintenances;
        this.applyMaintenanceFilters();
      },
      error: (err) => {
        console.error('Erreur chargement maintenances préventives:', err);
        this.maintenancesPreventives = [];
        this.applyMaintenanceFilters();
      }
    });
  }

  setMaintenanceStatutFilter(filter: 'TOUTES' | StatutPreventive): void {
    this.maintenanceStatutFilter = filter;
    this.maintenanceCurrentPage = 1;
    this.applyMaintenanceFilters();
  }

  applyMaintenanceFilters(): void {
    const term = this.maintenanceSearchTerm.trim().toLowerCase();

    const filtered = this.maintenancesPreventives.filter((m) => {
      const matchStatut =
        this.maintenanceStatutFilter === 'TOUTES' ? true : m.statut === this.maintenanceStatutFilter;

      const matchSearch =
        term.length === 0
          ? true
          : ((m.equipementReference || '').toLowerCase().includes(term) ||
             (m.description || '').toLowerCase().includes(term));

      return matchStatut && matchSearch;
    });

    this.maintenancesFiltered = filtered;

    const total = filtered.length;
    this.maintenanceTotalPages = Math.max(1, Math.ceil(total / this.maintenanceItemsPerPage));
    this.maintenanceTotalPagesArray = Array.from({ length: this.maintenanceTotalPages }, (_, i) => i + 1);

    const start = (this.maintenanceCurrentPage - 1) * this.maintenanceItemsPerPage;
    const end = Math.min(start + this.maintenanceItemsPerPage, total);

    this.maintenancePageStartIndex = total === 0 ? 0 : start + 1;
    this.maintenancePageEndIndex = end;

    this.maintenancesPaginated = filtered.slice(start, end);
  }

  goToMaintenancePage(page: number): void {
    if (page < 1 || page > this.maintenanceTotalPages) return;
    this.maintenanceCurrentPage = page;
    this.applyMaintenanceFilters();
  }

  getVisibleMaintenancesPages(): (number | string)[] {
    const maxVisible = 7;
    const pages: (number | string)[] = [];
    
    if (this.maintenanceTotalPages <= maxVisible) {
      for (let i = 1; i <= this.maintenanceTotalPages; i++) {
        pages.push(i);
      }
    } else {
      pages.push(1);
      
      let startPage: number;
      let endPage: number;
      
      if (this.maintenanceCurrentPage <= 4) {
        startPage = 2;
        endPage = 6;
      } else if (this.maintenanceCurrentPage >= this.maintenanceTotalPages - 3) {
        startPage = this.maintenanceTotalPages - 5;
        endPage = this.maintenanceTotalPages - 1;
      } else {
        startPage = this.maintenanceCurrentPage - 2;
        endPage = this.maintenanceCurrentPage + 2;
      }
      
      if (startPage > 2) {
        pages.push('...');
      }
      
      for (let i = startPage; i <= endPage; i++) {
        pages.push(i);
      }
      
      if (endPage < this.maintenanceTotalPages - 1) {
        pages.push('...');
      }
      
      pages.push(this.maintenanceTotalPages);
    }
    
    return pages;
  }

  openMaintenanceDetails(maintenance: MaintenancePreventive): void {
    this.selectedMaintenance = maintenance;
    this.showMaintenanceDetailsModal = true;
    this.lockBodyScroll();
    
    // Réinitialiser le formulaire
    this.maintenanceRapport = '';
    this.maintenancePiecesSelection = [{ nom: '', quantite: null }];
  }

  addMaintenancePieceRow(): void {
    this.maintenancePiecesSelection.push({ nom: '', quantite: null });
  }
  
  removeMaintenancePieceRow(index: number): void {
    this.maintenancePiecesSelection.splice(index, 1);
    if (this.maintenancePiecesSelection.length === 0) {
      this.maintenancePiecesSelection.push({ nom: '', quantite: null });
    }
  }

  parseMaintenancePiecesUtilisees(piecesJson: string | null): Array<{ nom: string; quantite: number }> {
    if (!piecesJson) return [];
    try {
      return JSON.parse(piecesJson);
    } catch (e) {
      console.error('Erreur parsing pièces:', e);
      return [];
    }
  }

  realiserMaintenance(): void {
    if (!this.selectedMaintenance || !this.maintenanceRapport.trim()) return;

    // Construire le JSON des pièces
    const pieces = this.maintenancePiecesSelection
      .filter(p => p.nom.trim() && p.quantite && p.quantite > 0)
      .map(p => ({ nom: p.nom.trim(), quantite: p.quantite as number }));

    const payload = {
      rapport: this.maintenanceRapport.trim(),
      piecesUtilisees: pieces.length > 0 ? JSON.stringify(pieces) : undefined,
      photoUrl: undefined,
      dateRealisee: new Date().toISOString().split('T')[0]
    };

    this.preventivesService.realiser(this.selectedMaintenance.id, payload).subscribe({
      next: () => {
        this.showToast('Maintenance réalisée avec succès! La prochaine occurrence a été créée automatiquement.', 'success');
        this.closeModals();
        this.chargerMaintenancesPreventives();
      },
      error: (err) => {
        console.error('Erreur lors de la réalisation:', err);
        this.showToast('Erreur lors de la réalisation de la maintenance', 'danger');
      }
    });
  }

  getNbMaintenancesByStatut(statut: StatutPreventive): number {
    return this.maintenancesPreventives.filter(m => m.statut === statut).length;
  }

  // Méthode pour formater le nom complet d'un technicien
  getTechnicienFullName(technicien: TechnicienUI): string {
    if (technicien.prenom && technicien.nom) {
      return `${technicien.prenom} ${technicien.nom}`;
    } else if (technicien.nom) {
      return technicien.nom;
    } else if (technicien.prenom) {
      return technicien.prenom;
    }
    return technicien.username || 'Technicien';
  }


  getNomComplet(): string {
    if (this.prenom && this.nom) {
      return `${this.prenom} ${this.nom}`;
    } else if (this.prenom) {
      return this.prenom;
    } else if (this.nom) {
      return this.nom;
    }
    return this.username;
  }

  // Gestion des notifications
  onNotificationClicked(notification: any): void {
      console.log('🔔 Notification cliquée:', notification);

      // Si c'est une notification de panne/demande
      if (notification.entityType === 'PANNE' && notification.entityId) {
        // Chercher l'intervention correspondante (l'entityId correspond à l'ID de la panne)
        const intervention = this.interventions.find((i: Intervention) => i.id === notification.entityId);
        const demande = this.mesDemandes.find((d: Demande) => d.id === notification.entityId);

        console.log('🔍 Intervention trouvée:', intervention);
        console.log('🔍 Demande trouvée:', demande);

        if (intervention) {
          // C'est une intervention affectée - ouvrir le modal
          this.setActive('interventions');
          setTimeout(() => {
            this.openDetails(intervention);
          }, 300);
        } else if (demande) {
          // C'est une demande personnelle
          this.setActive('mes-demandes');
          setTimeout(() => {
            this.openDemandeDetails(demande);
          }, 300);
        } else {
          // L'intervention n'est pas encore chargée, recharger les données
          console.log('⚠️ Intervention non trouvée, rechargement des données...');
          this.chargerInterventionsDepuisApi();

          // Attendre que les données soient chargées puis ouvrir le modal
          setTimeout(() => {
            const interventionReloaded = this.interventions.find((i: Intervention) => i.id === notification.entityId);
            if (interventionReloaded) {
              this.setActive('interventions');
              setTimeout(() => {
                this.openDetails(interventionReloaded);
              }, 300);
            } else {
              console.error('❌ Intervention toujours introuvable après rechargement');
              this.showToast('Intervention introuvable', 'danger');
            }
          }, 1000);
        }
      }

      // Si c'est une notification de maintenance préventive
      if (notification.entityType === 'MAINTENANCE_PREVENTIVE' && notification.entityId) {
        // Charger les maintenances préventives si pas encore chargées
        if (this.maintenancesPreventives.length === 0) {
          this.chargerMaintenancesPreventives();
        }

        // Aller à la section maintenances préventives
        this.setActive('maintenances-preventives');

        // Attendre que les données soient chargées et ouvrir le modal
        setTimeout(() => {
          const maintenance = this.maintenancesPreventives.find(m => m.id === notification.entityId);
          if (maintenance) {
            this.openMaintenanceDetails(maintenance);
          }
        }, 500);
      }
    }

}
