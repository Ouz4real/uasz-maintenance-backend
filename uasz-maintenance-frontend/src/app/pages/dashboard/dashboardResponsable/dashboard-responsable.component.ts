// src/app/pages/dashboard/dashboardResponsable/dashboard-responsable.component.ts

import { Component, OnInit, HostListener } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import jsPDF from 'jspdf';
import { AuthService } from '../../../core/services/auth';
import { HttpErrorResponse } from '@angular/common/http';
import { forkJoin } from 'rxjs';
import {
  PannesResponsableService,
  PanneDto,
  StatutPanneApi,
  PrioriteApi,
} from '../../../core/services/pannes-responsable.service';
import {UtilisateurDto} from '../../../core/services/utilisateurs.service'
import { environment } from '../../../../environments/environment';
import {UtilisateursService} from '../../../core/services/utilisateurs.service';
import {InterventionDto, InterventionsService} from '../../../core/services/interventions.service';
import { StatsTechnicienResponse } from '../../../core/services/stats-technicien-response';


// --- MES DEMANDES RESPONSABLE ---
export type MesDemandeStatut = 'EN_ATTENTE' | 'EN_COURS' | 'RESOLUE';

export interface InterventionUI {
  id: number;
  titre: string;
  lieu?: string;
  statut?: string;

  resultat?: string | null;

  // ✅ AJOUT
  dateDebut?: string | null;
  dateFin?: string | null;
}





export interface MesDemandeResponsable {
  id: number;
  titre: string;
  dateCreation: Date;
  lieu: string;
  statut: MesDemandeStatut;

  typeEquipement: string;
  description: string;
  imageUrl?: string;
}

interface NouvelleDemandeResponsableForm {
  titre: string;
  lieu: string;
  typeEquipement: string;
  description: string;
  imageFile: File | null;
  imagePreview: string | null;
}

/* ====================== INTERFACES UI ====================== */

interface Demande {
  id: number;
  titre: string;
  demandeurNom: string;
  lieu: string;
  typeEquipement: string;
  description: string;
  dateCreation: Date;
  statut: 'EN_ATTENTE' | 'EN_COURS' | 'RESOLUE';

  // ✅ Nouveau
  urgenceDemandeur: 'BASSE' | 'MOYENNE' | 'HAUTE' | null;
  urgenceResponsable: 'BASSE' | 'MOYENNE' | 'HAUTE' | 'NON_DEFINIE' | null;

  // ✅ Alias temporaire pour ne pas casser tout ton HTML/TS actuel
  urgence?: 'BASSE' | 'MOYENNE' | 'HAUTE' | 'NON_DEFINIE' | null;

  imageUrl?: string | null;
}




interface Intervention {
  titre: string;
  resultat: string;
  date: Date;
  lieu: string;
  statut: 'EN_ATTENTE' | 'EN_COURS' | 'RESOLUE';
}

interface Technicien {
  id: number;
  nom: string;
  categorie: string;
  disponible: boolean;
  specialites: string[];
  nbInterventionsEnCours: number;
  nbInterventionsTerminees: number;
  tempsMoyenResolutionHeures: number;
  interventionsEnCours?: InterventionUI[];
  dernieresInterventions?: InterventionUI[];
}

interface Equipement {
  reference: string;
  type: string;
  localisation: string;
  quantite: number;
  etat?: 'EN_SERVICE' | 'EN_PANNE' | 'HORS_SERVICE';
  derniereMaintenance?: Date | null;
  prochaineMaintenance?: Date | null;
}

interface PieceDetachee {
  nom: string;
  reference: string;
  stockActuel: number;
  stockMinimum: number;
  localisationStock: string;
}

type StatutPreventive = 'PLANIFIEE' | 'EN_RETARD' | 'REALISEE';


interface MaintenancePreventive {
  id: number;
  equipementReference: string | null;
  typeEquipement: string | null;
  frequence: string | null;
  prochaineDate: Date;
  responsable: string;
  statut: StatutPreventive;
  description: string;
}

interface DemandesParMois {
  mois: string;
  total: number;
}





export type TechnicienUI = {
  id: number;

  // Affichage
  nom: string;                 // ex: "Moussa Ba"
  categorie: string;           // ex: "Plomberie" (ou "Maintenance")
  serviceUnite?: string;       // ex: "Plomberie" (affiché entre parenthèses)
  departement?: string;        // ex: "Maintenance"
  username?: string;           // ex: "tech-plomb-1"

  // Détails / spécialités
  specialites: string[];       // ex: ["Plomberie"] (tu peux y mettre serviceUnite)
  disponible: boolean;

  // Stats affichées dans la LISTE (cartes)
  nbInterventionsEnCours: number;
  nbInterventionsTerminees: number;
  tempsMoyenResolutionHeures: number;

  // Interventions (modale détails technicien)
  interventionsEnCours?: InterventionUI[];
  dernieresInterventions?: InterventionUI[];

  // ✅ Stats “riches” (modale détails technicien)
  stats?: {
    enCours: number;
    terminees: number;
    tempsMoyen: string;        // ex: "1 h 30 min"
    tempsMoyenMinutes?: number; // ✅ utile si tu veux recalculer côté front
  };

  // ✅ Pour gérer l'UI proprement (loading/erreur par technicien)
  loadingInterventions?: boolean;
  errorInterventions?: string | null;

  loadingStats?: boolean;
  errorStats?: string | null;

  sousCategorie?: string;
};





/* ====================== COMPOSANT ====================== */

@Component({
  selector: 'app-dashboard-responsable',
  standalone: true,
  templateUrl: './dashboard-responsable.component.html',
  styleUrls: ['./dashboard-responsable.component.scss'],
  imports: [CommonModule, FormsModule, DatePipe],
})
export class DashboardResponsableComponent implements OnInit {
  // ====== MES DEMANDES (RESPONSABLE) ======
  mesDemandes: MesDemandeResponsable[] = [];
  mesDemandesFiltrees: MesDemandeResponsable[] = [];
  filtreStatut: 'TOUS' | 'EN_ATTENTE' | 'EN_COURS' | 'RESOLUE' = 'TOUS';


  loadingTechniciens = false;
  errorTechniciens: string | null = null;

  loadingTechStats = false;
  errorTechStats: string | null = null;



  showMesNewDemandeModal = false;
  showMesDetailsModal = false;
  selectedMesDemande: MesDemandeResponsable | null = null;
  showMesImageInDetails = false;
  techniciens: TechnicienUI[] = [];
  techniciensAffectables: TechnicienUI[] = [];
  filteredTechniciens: TechnicienUI[] = [];




  newMesDemande: NouvelleDemandeResponsableForm = {
    titre: '',
    lieu: '',
    typeEquipement: '',
    description: '',
    imageFile: null,
    imagePreview: null,
  };

  interventionsEnCours?: InterventionUI[];
  dernieresInterventions?: InterventionUI[];
  loadingTechInterventions = false;
  errorTechInterventions: string | null = null;



  /* ========== INFOS UTILISATEUR / LAYOUT ========== */

  username: string = 'Responsable';
  usernameInitial: string = 'R';
  userMenuOpen = false;

  showLogoutConfirm = false;
  showPreventiveForm = false;

  activeItem:
    | 'dashboard'
    | 'techniciens'
    | 'mes-demandes'
    | 'equipements'
    | 'preventives'
    | 'rapports'
    | 'help' = 'dashboard';

  setActive(
    item:
      | 'dashboard'
      | 'techniciens'
      | 'mes-demandes'
      | 'equipements'
      | 'preventives'
      | 'rapports'
      | 'help'
  ) {
    this.activeItem = item;
    if (item === 'techniciens') {
      this.chargerTechniciensDepuisApi();
    }
  }




  // ===== DEMANDES (GLOBAL) =====
  statusFilter: 'TOUTES' | 'EN_ATTENTE' | 'EN_COURS' | 'RESOLUE' = 'TOUTES';
  urgenceFilter: 'TOUTES' | 'BASSE' | 'MOYENNE' | 'HAUTE' = 'TOUTES';
  modalUrgenceResponsable: '' | 'BASSE' | 'MOYENNE' | 'HAUTE' = '';
  searchTerm: string = '';

  demandes: Demande[] = []; // ✅ manquait parfois : indispensable
  filteredDemandes: Demande[] = [];
  paginatedDemandes: Demande[] = [];
  pageSize = 5;
  currentPage = 1;
  totalPages = 1;
  totalPagesArray: number[] = [];
  pageStartIndex = 0;
  pageEndIndex = 0;

  totalDemandes = 0;
  enAttente = 0;
  enCours = 0;
  resolues = 0;

  demandesParMois: DemandesParMois[] = [
    { mois: 'Jan', total: 8 },
    { mois: 'Fév', total: 12 },
    { mois: 'Mar', total: 10 },
    { mois: 'Avr', total: 6 },
  ];
  maxDemandesParMois = 12;

  statusPercentEnAttente = 0;
  statusPercentEnCours = 0;
  statusPercentResolues = 0;

  tempsMoyenResolutionGlobal = 12;

  /* ========== TECHNICIENS ========== */



// ✅ filtres
  technicienSearchTerm = '';
  technicienDisponibiliteFilter: 'TOUS' | 'DISPONIBLE' | 'OCCUPE' = 'TOUS';
  technicienCategorieFilter: string = 'TOUTES';
  technicienCategories: string[] = [];



  onTechnicienSearchChange(value: string): void {
    this.technicienSearchTerm = (value ?? '').toLowerCase().trim();
    this.applyTechnicienFilters();
  }

  onTechnicienFiltersChanged(): void {
    this.applyTechnicienFilters();
  }

  private applyTechnicienFilters(): void {
    let list = [...this.techniciens];

    if (this.technicienSearchTerm) {
      const q = this.technicienSearchTerm;
      list = list.filter((t) => {
        const hay = `${t.nom} ${t.categorie} ${(t.specialites || []).join(' ')}`.toLowerCase();
        return hay.includes(q);
      });
    }

    if (this.technicienDisponibiliteFilter === 'DISPONIBLE') {
      list = list.filter((t) => t.disponible);
    } else if (this.technicienDisponibiliteFilter === 'OCCUPE') {
      list = list.filter((t) => !t.disponible);
    }

    if (this.technicienCategorieFilter && this.technicienCategorieFilter !== 'TOUTES') {
      list = list.filter((t) => t.categorie === this.technicienCategorieFilter);
    }

    this.filteredTechniciens = list;
  }

  private chargerTechniciensDepuisApi(): void {
    this.loadingTechniciens = true;
    this.errorTechniciens = null;

    this.utilisateursService.getTechniciens().subscribe({
      next: (list: UtilisateurDto[]) => {
        const onlyTech: UtilisateurDto[] = (list ?? []).filter((u: UtilisateurDto) =>
          String(u?.role ?? '').toUpperCase() === 'TECHNICIEN'
        );

        const items: TechnicienUI[] = onlyTech.map((u: UtilisateurDto) =>
          this.mapUserToTechnicienUI(u)
        );

        this.techniciens = items;
        this.techniciensAffectables = [...items];
        this.filteredTechniciens = [...items];

        this.technicienCategories = Array.from(
          new Set(items.map((t: TechnicienUI) => t.categorie).filter(Boolean))
        ).sort((a: string, b: string) => a.localeCompare(b));

        this.applyTechnicienFilters();

        this.loadingTechniciens = false;

        // ✅ IMPORTANT : charger les stats APRÈS avoir la liste
        this.chargerStatsTechniciens();
      },
      error: (err) => {
        console.error('Erreur chargement techniciens:', err);
        this.errorTechniciens = 'Impossible de charger les techniciens.';
        this.techniciens = [];
        this.techniciensAffectables = [];
        this.filteredTechniciens = [];
        this.technicienCategories = [];
        this.applyTechnicienFilters();
        this.loadingTechniciens = false;
      },
    });
  }


  private chargerStatsTechniciens(): void {
    if (!this.techniciens || this.techniciens.length === 0) return;

    this.loadingTechStats = true;
    this.errorTechStats = null;

    const requests = this.techniciens.map((t) =>
      this.interventionsService.getStatsByTechnicien(t.id)
    );

    forkJoin(requests).subscribe({
      next: (statsList) => {
        // On crée un map pour accéder vite par technicienId
        const statsMap = new Map<number, StatsTechnicienResponse>();
        (statsList ?? []).forEach((s) => statsMap.set(s.technicienId, s));

        // On injecte dans chaque technicien
        this.techniciens = this.techniciens.map((t) => {
          const s = statsMap.get(t.id);

          return {
            ...t,
            stats: {
              enCours: s?.interventionsEnCours ?? 0,
              terminees: s?.interventionsTerminees ?? 0,
              tempsMoyen: s?.tempsMoyenAffichage ?? '0 h',
            },

            // si tu veux aussi remplir tes anciens champs (optionnel)
            nbInterventionsEnCours: s?.interventionsEnCours ?? t.nbInterventionsEnCours ?? 0,
            nbInterventionsTerminees: s?.interventionsTerminees ?? t.nbInterventionsTerminees ?? 0,
            tempsMoyenResolutionHeures: s?.tempsMoyenMinutes
              ? Math.round((s.tempsMoyenMinutes / 60) * 10) / 10
              : (t.tempsMoyenResolutionHeures ?? 0),
          };
        });

        // si tu utilises filteredTechniciens ailleurs, on la rafraîchit
        this.filteredTechniciens = [...this.techniciens];

        this.loadingTechStats = false;
      },
      error: (err) => {
        console.error('Erreur chargement stats techniciens:', err);
        this.errorTechStats = 'Impossible de charger les statistiques des techniciens.';
        this.loadingTechStats = false;
      },
    });
  }









  /* ========== ÉQUIPEMENTS & STOCK ========== */

  equipementSearchTerm = '';
  equipementEtatFilter: 'TOUS' | 'EN_SERVICE' | 'EN_PANNE' | 'HORS_SERVICE' = 'TOUS';
  equipementTypeFilter: 'TOUS' | string = 'TOUS';
  equipementLocalisationFilter: 'TOUS' | string = 'TOUS';

  equipementTypes: string[] = ['PC bureau', 'Imprimante', 'Vidéo-projecteur'];
  equipementLocalisations: string[] = ['Salle info 1', 'Scolarité', 'Amphi A'];

  equipements: Equipement[] = [
    {
      reference: 'PC-001',
      type: 'PC bureau',
      localisation: 'Salle info 1',
      quantite: 10,
      etat: 'EN_SERVICE',
      derniereMaintenance: new Date('2025-01-10'),
      prochaineMaintenance: new Date('2025-04-10'),
    },
    {
      reference: 'IMP-010',
      type: 'Imprimante',
      localisation: 'Scolarité',
      quantite: 3,
      etat: 'EN_PANNE',
      derniereMaintenance: new Date('2024-12-20'),
      prochaineMaintenance: new Date('2025-03-01'),
    },
    {
      reference: 'VP-003',
      type: 'Vidéo-projecteur',
      localisation: 'Amphi A',
      quantite: 2,
      etat: 'HORS_SERVICE',
      derniereMaintenance: null,
      prochaineMaintenance: null,
    },
  ];

  filteredEquipements: Equipement[] = [];

  showEquipementModal = false;
  isEditingEquipement = false;

  equipementTypesUniversite: string[] = [
    'PC bureau',
    'PC portable',
    'Imprimante',
    'Photocopieur',
    'Scanner',
    'Vidéo-projecteur',
    'Écran',
    'Switch réseau',
    'Routeur',
    'Serveur',
    'Onduleur',
  ];

  equipementTypeSelection: string = '';

  equipementForm: {
    reference: string;
    type: string;
    localisation: string;
    quantite: number | null;
  } = {
    reference: '',
    type: '',
    localisation: '',
    quantite: 0,
  };

  get isEquipementFormValid(): boolean {
    return !!(
      this.equipementForm.reference.trim() &&
      this.equipementForm.type.trim() &&
      this.equipementForm.localisation.trim() &&
      this.equipementForm.quantite !== null &&
      this.equipementForm.quantite >= 0
    );
  }

  getImageSrc(p: { imageUrl?: string | null; imagePath?: string | null }): string | null {
    const v = (p.imageUrl || p.imagePath || '').trim();
    if (!v) return null;

    if (v.startsWith('http://') || v.startsWith('https://')) return v;

    // ✅ enlève /api si présent dans apiUrl
    const base = environment.apiUrl.replace(/\/api\/?$/, '');
    return `${base}/uploads/${v}`;
  }
  private readonly serverBaseUrl = environment.apiUrl.replace(/\/api\/?$/, '');
// ex: "http://localhost:8080"

  resolveImageUrl(v?: string | null): string | null {
    if (!v) return null;

    // si déjà une URL complète
    if (/^https?:\/\//i.test(v)) return v;

    // si "/uploads/..."
    if (v.startsWith('/')) return `${this.serverBaseUrl}${v}`;

    // fallback
    return `${this.serverBaseUrl}/${v}`;
  }


  /* ========== STOCK PIÈCES ========== */

  piecesDetachees: PieceDetachee[] = [
    {
      nom: 'Lampe VP standard',
      reference: 'LAMPE-VP-STD',
      stockActuel: 2,
      stockMinimum: 3,
      localisationStock: 'Magasin central',
    },
    {
      nom: 'Tambour imprimante laser',
      reference: 'TAMB-IMP-LSR',
      stockActuel: 5,
      stockMinimum: 2,
      localisationStock: 'Magasin scolarité',
    },
  ];

  /* ========== MAINTENANCE PRÉVENTIVE ========== */

  preventiveSearchTerm = '';
  preventiveStatutFilter: 'TOUS' | StatutPreventive = 'TOUS';

  maintenancesPreventives: MaintenancePreventive[] = [
    {
      id: 1,
      equipementReference: 'PC-001',
      typeEquipement: 'PC bureau',
      frequence: 'Tous les 6 mois',
      prochaineDate: new Date('2025-04-10'),
      responsable: 'Ousmane Mané',
      statut: 'PLANIFIEE',
      description: 'Nettoyage interne et contrôle disque.',
    },
    {
      id: 2,
      equipementReference: 'IMP-010',
      typeEquipement: 'Imprimante',
      frequence: 'Tous les 3 mois',
      prochaineDate: new Date('2025-03-01'),
      responsable: 'Awa Diallo',
      statut: 'EN_RETARD',
      description: 'Nettoyage rouleaux et tambour.',
    },
    {
      id: 3,
      equipementReference: 'VP-003',
      typeEquipement: 'Vidéo-projecteur',
      frequence: 'Tous les 12 mois',
      prochaineDate: new Date('2025-08-15'),
      responsable: 'Ousmane Mané',
      statut: 'REALISEE',
      description: 'Changement de lampe et nettoyage optique.',
    },
  ];

  filteredMaintenancesPreventives: MaintenancePreventive[] = [];
  equipementOptions: string[] = [];

  newPreventive: {
    equipementReference: string | null;
    typeEquipement: string | null;
    frequence: string | null;
    prochaineDate: string;
    responsable: string;
    statut: StatutPreventive | null;
    description: string;
  } = {
    equipementReference: null,
    typeEquipement: null,
    frequence: null,
    prochaineDate: '',
    responsable: '',
    statut: null,
    description: '',
  };

  rapportDateDebut: string | null = null;
  rapportDateFin: string | null = null;
  today: string = new Date().toISOString().substring(0, 10);
  canExportRapport: boolean = false;

  /* ========== MODALES DEMANDE / TECHNICIEN ========= */

  showDetailsModal: boolean = false;
  selectedDemande: any;

  modalUrgence: '' | 'BASSE' | 'MOYENNE' | 'HAUTE' = '';
  modalTechnicienId: number | null = null;
  modalCommentaire: string = '';
  showImageInDetails = false;
  markAsResolved = false;

  get canExportSelected(): boolean {
    return !!this.selectedDemande && this.selectedDemande.statut === 'RESOLUE';
  }

  get isSaveDisabled(): boolean {
    if (!this.selectedDemande) return true;
    return false;
  }

  showTechnicienModal = false;
  selectedTechnicien: Technicien | null = null;

  showPreventiveDetails = false;
  selectedPreventive: MaintenancePreventive | null = null;
// Lightbox
  isImageLightboxOpen = false;
  lightboxImageSrc: string | null = null;





  /* ========== CONSTRUCTEUR / INIT ========== */
  constructor(
    private authService: AuthService,
    private router: Router,
    private pannesRespApi: PannesResponsableService,
    private utilisateursService: UtilisateursService,
    private interventionsService: InterventionsService
  ) {}

  goToProfile(): void {
    this.userMenuOpen = false;
    this.router.navigate(['/profil']);
  }

  private chargerTechniciens(): void {
    this.loadingTechniciens = true;
    this.errorTechniciens = null;

    this.utilisateursService.getTechniciens().subscribe({
      next: (list) => {
        this.techniciens = (list ?? []).map((u) => this.mapUserToTechnicienUI(u));
        this.refreshTechnicienCategoriesAndFilters();

        this.loadingTechniciens = false;
      },
      error: (err) => {
        console.error('Erreur chargement techniciens:', err);
        this.techniciens = [];
        this.loadingTechniciens = false;
        this.errorTechniciens = "Impossible de charger les techniciens.";
      },
    });
  }


  ngOnInit(): void {
    this.usernameInitial = this.username.charAt(0).toUpperCase();

    // 1) demandes
    forkJoin({
      pannes: this.pannesRespApi.getAllPannes(),
      mesPannes: this.pannesRespApi.getMyPannes(),
    }).subscribe({
      next: ({ pannes, mesPannes }) => {
        this.demandes = this.mapPannesToDemandes(pannes);
        this.recalculateDemandesStats();
        this.applyDemandesFilters();
        this.recalculateStatusPercentages();

        this.mesDemandes = this.mapPannesToMesDemandes(mesPannes);
        this.appliquerFiltreMesDemandes();

        this.filterEquipements();
        this.refreshEquipementOptions();
        this.filterPreventives();
      },
      error: (err) => {
        console.error('Erreur chargement responsable:', err);
        this.demandes = [];
        this.filteredDemandes = [];
        this.paginatedDemandes = [];
      },
    });

    // 2) techniciens (séparé → plus robuste)
    this.chargerTechniciensDepuisApi();
  }




  openImageLightbox(src: string | null | undefined): void {
    if (!src) return;
    this.lightboxImageSrc = src;
    this.isImageLightboxOpen = true;
  }

  closeImageLightbox(): void {
    this.isImageLightboxOpen = false;
    this.lightboxImageSrc = null;
  }
  @HostListener('document:keydown.escape')
  onEscKey(): void {
    if (this.isImageLightboxOpen) {
      this.closeImageLightbox();
    }
  }


  /** ✅ utile pour recharger après création */
  private chargerDemandesDepuisApi(): void {
    this.pannesRespApi.getAllPannes()
      // .pipe(finalize(() => this.loadingDemandes = false)) // optionnel si tu as un loader
      .subscribe({
        next: (items: PanneDto[]) => {
          this.demandes = this.mapPannesToDemandes(items);
          this.refreshDemandesUi();
        },
        error: (err: HttpErrorResponse) => {
          console.error('Erreur chargement pannes (Responsable):', err);

          // ✅ si 401/403 : token invalide/expiré ou accès refusé
          if (err.status === 401 || err.status === 403) {
            // important : vider le localStorage pour éviter les états bizarres
            this.authService.logout();
            return;
          }

          this.demandes = [];
          this.refreshDemandesUi();
        },
      });
  }

  /** ✅ regroupe tout le recalcul UI pour éviter de répéter partout */
  private refreshDemandesUi(): void {
    this.recalculateDemandesStats();
    this.recalculateStatusPercentages();
    this.applyDemandesFilters();
  }

  /* ========== USER MENU ========== */

  toggleUserMenu(event: MouseEvent): void {
    event.stopPropagation();
    this.userMenuOpen = !this.userMenuOpen;
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (!target.closest('.topbar-right')) {
      this.userMenuOpen = false;
    }
  }

  openLogoutConfirm(): void {
    this.showLogoutConfirm = true;
  }

  cancelLogoutConfirm(): void {
    this.showLogoutConfirm = false;
  }

  confirmLogout(): void {
    this.showLogoutConfirm = false;
    this.userMenuOpen = false;
    this.authService.logout();
  }

  goToDashboard(): void {
    this.activeItem = 'dashboard';
    this.userMenuOpen = false;
  }

  /* ========== RAPPORTS : DATES ========= */

  onRapportDatesChanged(): void {
    if (!this.rapportDateDebut || !this.rapportDateFin) {
      this.canExportRapport = false;
      return;
    }

    const start = new Date(this.rapportDateDebut);
    const end = new Date(this.rapportDateFin);
    const todayDate = new Date(this.today);

    if (start > end || start > todayDate || end > todayDate) {
      this.canExportRapport = false;
      return;
    }

    this.canExportRapport = true;
  }

  /* ========== MAPPING API -> UI (CENTRAL) ========= */

  private mapPannesToDemandes(list: PanneDto[]): Demande[] {
    return (list ?? []).map(p => ({
      id: p.id,
      titre: p.titre,
      demandeurNom: (p as any).demandeurNom ?? p.signaleePar ?? '—',
      lieu: p.lieu,
      typeEquipement: p.typeEquipement,
      description: p.description,
      dateCreation: this.safeDateIso(p),
      statut: this.mapStatutApiToUi((p as any).statut ?? p.statut),

      urgenceDemandeur: (p as any).priorite ?? null,
      urgenceResponsable: 'NON_DEFINIE',

      // alias temporaire
      urgence: (p as any).priorite ?? null,

      imageUrl: (p as any).imageUrl ?? (p as any).imagePath ?? null,
    }));
  }


  private mapPannesToMesDemandes(list: PanneDto[]): MesDemandeResponsable[] {
    return (list ?? []).map((p) => ({
      id: p.id,
      titre: p.titre,
      dateCreation: this.safeDateIso(p),
      lieu: p.lieu,
      statut: this.mapStatutApiToUi(p.statut),
      typeEquipement: p.typeEquipement,
      description: p.description,
      imageUrl: (p.imageUrl ?? p.imagePath ?? undefined) ?? undefined,
    }));
  }

  private mapStatutApiToUi(apiStatut: StatutPanneApi | any): 'EN_ATTENTE' | 'EN_COURS' | 'RESOLUE' {
    if (apiStatut === 'OUVERTE') return 'EN_ATTENTE';
    if (apiStatut === 'EN_COURS') return 'EN_COURS';
    return 'RESOLUE';
  }

  private mapStatutUiToApi(ui: 'EN_ATTENTE' | 'EN_COURS' | 'RESOLUE'): StatutPanneApi {
    if (ui === 'EN_ATTENTE') return 'OUVERTE';
    if (ui === 'EN_COURS') return 'EN_COURS';
    return 'RESOLUE';
  }

  private mapPrioriteApiToUrgenceUi(p: PrioriteApi | null | any): Demande['urgence'] {
    if (!p) return null;
    if (p === 'BASSE' || p === 'MOYENNE' || p === 'HAUTE') return p;
    return null;
  }

  private safeDateIso(p: any): Date {
    const iso = p?.dateCreation || p?.createdAt || p?.created_at;
    return iso ? new Date(iso) : new Date();
  }

  /* ========== DEMANDES : FILTRES / PAGINATION ========== */

  onStatusFilterChange(status: 'TOUTES' | 'EN_ATTENTE' | 'EN_COURS' | 'RESOLUE'): void {
    this.statusFilter = status;
    this.applyDemandesFilters();
  }

  onUrgenceFilterChange(urgence: 'TOUTES' | 'BASSE' | 'MOYENNE' | 'HAUTE'): void {
    this.urgenceFilter = urgence;
    this.applyDemandesFilters();
  }

  onSearchTermChange(term: string): void {
    this.searchTerm = term.toLowerCase();
    this.applyDemandesFilters();
  }

  private applyDemandesFilters(): void {
    let list = [...this.demandes];

    if (this.statusFilter !== 'TOUTES') {
      list = list.filter((d) => d.statut === this.statusFilter);
    }

    if (this.urgenceFilter !== 'TOUTES') {
      list = list.filter((d) => d.urgence === this.urgenceFilter);
    }

    if (this.searchTerm.trim().length > 0) {
      list = list.filter((d) =>
        (d.titre || '').toLowerCase().includes(this.searchTerm) ||
        (d.demandeurNom || '').toLowerCase().includes(this.searchTerm) ||
        (d.statut || '').toLowerCase().includes(this.searchTerm)
      );
    }

    this.filteredDemandes = list;
    this.currentPage = 1;
    this.updatePagination();
  }

  private updatePagination(): void {
    const total = this.filteredDemandes.length;
    this.totalPages = Math.max(1, Math.ceil(total / this.pageSize));
    this.totalPagesArray = Array.from({ length: this.totalPages }, (_, i) => i + 1);

    const start = (this.currentPage - 1) * this.pageSize;
    const end = Math.min(start + this.pageSize, total);

    this.pageStartIndex = total === 0 ? 0 : start + 1;
    this.pageEndIndex = end;

    this.paginatedDemandes = this.filteredDemandes.slice(start, end);
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.updatePagination();
    }
  }

  previousPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.updatePagination();
    }
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.updatePagination();
    }
  }

  recalculateDemandesStats(): void {
    this.totalDemandes = this.demandes.length;
    this.enAttente = this.demandes.filter((d) => d.statut === 'EN_ATTENTE').length;
    this.enCours = this.demandes.filter((d) => d.statut === 'EN_COURS').length;
    this.resolues = this.demandes.filter((d) => d.statut === 'RESOLUE').length;
  }

  recalculateStatusPercentages(): void {
    const total = this.totalDemandes || 1;
    this.statusPercentEnAttente = Math.round((this.enAttente / total) * 100);
    this.statusPercentEnCours = Math.round((this.enCours / total) * 100);
    this.statusPercentResolues = Math.round((this.resolues / total) * 100);
  }

  getStatusCount(statut: 'EN_ATTENTE' | 'EN_COURS' | 'RESOLUE'): number {
    return this.demandes.filter((d) => d.statut === statut).length;
  }

  getUrgencePillClass(u: any): string {
    const v = (u ?? 'NON_DEFINIE').toString().toUpperCase();

    if (v === 'BASSE') return 'pill-low';
    if (v === 'MOYENNE') return 'pill-medium';
    if (v === 'HAUTE') return 'pill-high';

    return 'pill-undefined';
  }

  getUrgenceLabel(u: any): string {
    const v = (u ?? 'NON_DEFINIE').toString().toUpperCase();

    if (v === 'BASSE') return 'Basse';
    if (v === 'MOYENNE') return 'Moyenne';
    if (v === 'HAUTE') return 'Haute';

    return 'Non définie';
  }

  getUrgenceListClass(
    u: 'BASSE' | 'MOYENNE' | 'HAUTE' | null | undefined
  ): string {
    switch (u) {
      case 'BASSE':
        return 'urgency-low';
      case 'MOYENNE':
        return 'urgency-medium';
      case 'HAUTE':
        return 'urgency-high';
      default:
        return 'urgency-none';
    }
  }




  getStatutLabel(s: Demande['statut']): string {
    if (s === 'EN_ATTENTE') return 'En attente';
    if (s === 'EN_COURS') return 'En cours';
    return 'Résolue';
  }

  /* ========== MES DEMANDES ========== */

  private appliquerFiltreMesDemandes(): void {
    if (this.filtreStatut === 'TOUS') {
      this.mesDemandesFiltrees = [...this.mesDemandes];
    } else {
      this.mesDemandesFiltrees = this.mesDemandes.filter((d) => d.statut === this.filtreStatut);
    }
  }

  changerFiltreStatut(statut: 'TOUS' | 'EN_ATTENTE' | 'EN_COURS' | 'RESOLUE'): void {
    this.filtreStatut = statut;
    this.appliquerFiltreMesDemandes();
  }

  badgeClass(statut: MesDemandeStatut): string {
    switch (statut) {
      case 'EN_ATTENTE':
        return 'badge-waiting';
      case 'EN_COURS':
        return 'badge-progress';
      case 'RESOLUE':
        return 'badge-done';
      default:
        return '';
    }
  }

  libelleStatut(statut: MesDemandeStatut): string {
    switch (statut) {
      case 'EN_ATTENTE':
        return 'En attente';
      case 'EN_COURS':
        return 'En cours';
      case 'RESOLUE':
        return 'Résolue';
      default:
        return statut;
    }
  }

  ouvrirNouvelleDemande(): void {
    this.showMesNewDemandeModal = true;
  }

  closeMesNewDemandeModal(): void {
    this.showMesNewDemandeModal = false;
    this.newMesDemande = {
      titre: '',
      lieu: '',
      typeEquipement: '',
      description: '',
      imageFile: null,
      imagePreview: null,
    };
  }

  onMesFileSelected(e: Event): void {
    const input = e.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      this.newMesDemande.imageFile = file;

      const reader = new FileReader();
      reader.onload = () => {
        this.newMesDemande.imagePreview = reader.result as string;
      };
      reader.readAsDataURL(file);
    }
  }

  removeMesSelectedImage(): void {
    this.newMesDemande.imageFile = null;
    this.newMesDemande.imagePreview = null;
    const fileInput = document.getElementById('image-resp') as HTMLInputElement | null;
    if (fileInput) fileInput.value = '';
  }

  submitMesNewDemande(): void {
    if (!this.newMesDemande.titre || !this.newMesDemande.lieu) return;

    const fd = new FormData();
    fd.append('titre', this.newMesDemande.titre);
    fd.append('description', this.newMesDemande.description || '');
    fd.append('typeEquipement', this.newMesDemande.typeEquipement || '');
    fd.append('lieu', this.newMesDemande.lieu);

    if (this.newMesDemande.imageFile) {
      fd.append('image', this.newMesDemande.imageFile);
    }

    // ✅ Responsable peut créer une panne (backend autorise ROLE_RESPONSABLE_MAINTENANCE)
    this.pannesRespApi.createPanne(fd).subscribe({
      next: () => {
        // reload safe
        this.chargerDemandesDepuisApi();
        // reload mes demandes aussi
        this.pannesRespApi.getMyPannes().subscribe({
          next: (mine) => {
            this.mesDemandes = this.mapPannesToMesDemandes(mine);
            this.appliquerFiltreMesDemandes();
          },
          error: (e) => console.error('Erreur rechargement mes pannes:', e),
        });

        this.closeMesNewDemandeModal();
      },
      error: (err) => console.error('Erreur création panne:', err),
    });
  }

  ouvrirDetailDemande(demande: MesDemandeResponsable): void {
    this.selectedMesDemande = demande;
    this.selectedDemande.imageUrl = this.resolveImageUrl(
      this.selectedDemande.imageUrl || this.selectedDemande.imagePath
    );
    this.showMesDetailsModal = true;
    this.showMesImageInDetails = false;
  }

  closeMesDetailsModal(): void {
    this.showMesDetailsModal = false;
    this.selectedMesDemande = null;
  }

  countMesParStatut(statut: 'EN_ATTENTE' | 'EN_COURS' | 'RESOLUE'): number {
    return this.mesDemandes.filter((d) => d.statut === statut).length;
  }

  /* ========== DÉTAILS DEMANDE (MODALE GLOBAL) ========== */

  openDemandeDetails(d: Demande): void {
    this.selectedDemande = { ...d };
    this.selectedDemande.imageUrl = this.resolveImageUrl(
      this.selectedDemande.imageUrl || (this.selectedDemande as any).imagePath
    );

    this.modalTechnicienId = null;
    this.modalCommentaire = '';
    this.showImageInDetails = false;
    this.markAsResolved = d.statut === 'RESOLUE';
    this.showDetailsModal = true;

    // ✅ Urgence responsable : par défaut "Non définie"
    this.modalUrgenceResponsable = '';

    // ✅ dropdown intelligent + fallback
    const filtered = this.filterTechniciensForDemande(this.selectedDemande);

    this.techniciensAffectables =
      (filtered && filtered.length > 0) ? filtered : [...this.techniciens];
  }



  closeDetailsModal(): void {
    this.showDetailsModal = false;
    this.selectedDemande = null;
  }

  saveDetails(): void {
    if (!this.selectedDemande) return;

    const id = this.selectedDemande.id as number;

    // ===== 1) STATUT =====
    const statutUiFinal: 'EN_ATTENTE' | 'EN_COURS' | 'RESOLUE' =
      this.markAsResolved ? 'RESOLUE' : (this.selectedDemande.statut ?? 'EN_COURS');

    const statutApiFinal = this.mapStatutUiToApi(statutUiFinal);

    // ===== 2) URGENCE (RESPONSABLE) =====
    // ('' => on ne touche pas au backend)
    const prioriteResp = this.modalUrgenceResponsable; // '' | BASSE | MOYENNE | HAUTE

    // Si l'utilisateur n'a pas choisi d'urgence responsable → on fait comme avant (statut seul)
    if (!prioriteResp) {
      this.pannesRespApi.updateStatut(id, statutApiFinal).subscribe({
        next: (updatedApi) => {
          const index = this.demandes.findIndex((d) => d.id === id);
          if (index !== -1) {
            this.demandes[index] = {
              ...this.demandes[index],
              statut: this.mapStatutApiToUi(updatedApi.statut),

              // ✅ Urgence du demandeur (priorite) : on ne la change pas ici
              // ton champ local "urgence" doit rester ce que tu affiches en read-only
              urgence: (this.demandes[index].urgence) as any,
            } as any;
          }

          this.recalculateDemandesStats();
          this.recalculateStatusPercentages();
          this.applyDemandesFilters();
          this.closeDetailsModal();
        },
        error: (err) => console.error('Erreur maj statut:', err),
      });

      return;
    }

    // Sinon → on fait les 2 PATCH en parallèle
    // ⚠️ Assure-toi d'avoir : import { forkJoin } from 'rxjs';
    forkJoin({
      statut: this.pannesRespApi.updateStatut(id, statutApiFinal),
      prioResp: this.pannesRespApi.updatePrioriteResponsable(id, prioriteResp),
    }).subscribe({
      next: ({ statut, prioResp }) => {
        // On prend la réponse la plus "complète" si ton backend renvoie tout
        const updated = (prioResp ?? statut) as any;

        const index = this.demandes.findIndex((d) => d.id === id);
        if (index !== -1) {
          this.demandes[index] = {
            ...this.demandes[index],

            // ✅ statut UI depuis réponse
            statut: this.mapStatutApiToUi(updated.statut),

            // ✅ Urgence DEMANDEUR (priorite) : si backend la renvoie
            // sinon on garde l'existante
            urgence: (updated.priorite ?? this.demandes[index].urgence) as any,

            // ✅ Urgence RESPONSABLE : stock local (si tu n'as pas encore ce champ dans Demande)
            // tu pourras typer + persister proprement plus tard
            prioriteResponsable: (updated.prioriteResponsable ?? prioriteResp) as any,
          } as any;
        }

        this.recalculateDemandesStats();
        this.recalculateStatusPercentages();
        this.applyDemandesFilters();
        this.closeDetailsModal();
      },
      error: (err) => console.error('Erreur maj statut/priorité responsable:', err),
    });
  }

  exportSelectedAsPdf(): void {
    if (!this.selectedDemande) return;
    console.log('Export PDF pour la demande', this.selectedDemande.id);
  }



  /* ========== TECHNICIENS ========== */



  private filterTechniciens(): void {
    let list = [...this.techniciens];

    if (this.technicienDisponibiliteFilter === 'DISPONIBLE') {
      list = list.filter((t) => t.disponible);
    } else if (this.technicienDisponibiliteFilter === 'OCCUPE') {
      list = list.filter((t) => !t.disponible);
    }

    if (this.technicienCategorieFilter !== 'TOUTES') {
      list = list.filter((t) => t.categorie === this.technicienCategorieFilter);
    }

    if (this.technicienSearchTerm.trim().length > 0) {
      list = list.filter(
        (t) =>
          t.nom.toLowerCase().includes(this.technicienSearchTerm) ||
          t.categorie.toLowerCase().includes(this.technicienSearchTerm)
      );
    }

    this.filteredTechniciens = list;
  }

  private mapInterventionsToUi(list: any[]): InterventionUI[] {
    return (list ?? []).map((it: any) => ({
      id: it.id,
      titre: it.titre ?? '',
      lieu: it?.panne?.lieu ?? it?.lieu ?? '',
      statut: it?.statut ?? '',

      resultat: it?.resultat ?? null,

      // ✅ ICI
      dateDebut: it?.dateDebut ?? null,
      dateFin: it?.dateFin ?? null,
    }));
  }



  openTechnicienDetails(t: TechnicienUI): void {
    this.selectedTechnicien = {
      ...t,
      interventionsEnCours: [],
      dernieresInterventions: [],
    };

    this.showTechnicienModal = true;
    this.loadingTechInterventions = true;
    this.errorTechInterventions = null;

    const techId = t.id;

    forkJoin({
      enCours: this.interventionsService.getEnCoursByTechnicien(techId),
      recentes: this.interventionsService.getRecentesByTechnicien(techId),
    }).subscribe({
      next: ({ enCours, recentes }) => {
        if (!this.selectedTechnicien) return;

        this.selectedTechnicien.interventionsEnCours = this.mapInterventionsToUi(enCours);
        this.selectedTechnicien.dernieresInterventions = this.mapInterventionsToUi(recentes);

        this.loadingTechInterventions = false;
      },
      error: (err) => {
        console.error('Erreur chargement interventions technicien:', err);
        this.errorTechInterventions = "Impossible de charger les interventions du technicien.";
        this.loadingTechInterventions = false;
      },
    });
  }



  closeTechnicienModal(): void {
    this.showTechnicienModal = false;
    this.selectedTechnicien = null;
  }



  private mapUserToTechnicienUI(u: any): TechnicienUI {
    // =========================
    // 1) Nom affiché
    // =========================
    const prenom = (u?.prenom ?? '').trim();
    const nom = (u?.nom ?? '').trim();

    const fullName = `${prenom} ${nom}`.trim();
    const nomAffiche = fullName || u?.username || u?.email || '—';

    // =========================
    // 2) Service / Département
    // =========================
    const serviceUnite = (u?.serviceUnite ?? '').trim();
    const departement = (u?.departement ?? '').trim();

    /**
     * ✅ Règle recommandée (propre et stable) :
     * - categorie = departement (si présent)
     * - sinon serviceUnite
     * - sinon "Général"
     *
     * ✅ Et on met `sousCategorie` = serviceUnite seulement si différent de categorie
     */
    const categorie = departement || serviceUnite || 'Général';

    const sousCategorie =
      serviceUnite && serviceUnite.toLowerCase() !== categorie.toLowerCase()
        ? serviceUnite
        : undefined;

    // =========================
    // 3) Spécialités (optionnel)
    // =========================
    /**
     * ✅ Ici on évite la répétition :
     * - On met en spécialités uniquement la sousCategorie (si elle existe)
     * - Sinon on laisse vide (ça évite "Général · Général")
     */
    const specialites = sousCategorie ? [sousCategorie] : [];

    // =========================
    // 4) Disponibilité
    // =========================
    const nbEnCours = Number(u?.nbInterventionsEnCours ?? 0);

    const disponible =
      typeof u?.disponible === 'boolean'
        ? u.disponible
        : nbEnCours === 0;

    // =========================
    // 5) Construction finale
    // =========================
    return {
      id: Number(u?.id),

      // affichage
      nom: nomAffiche,
      categorie,
      sousCategorie,
      serviceUnite: serviceUnite || undefined,
      departement: departement || undefined,
      username: u?.username,

      // spécialités
      specialites,

      // état
      disponible,

      // stats simples (liste techniciens)
      nbInterventionsEnCours: nbEnCours,
      nbInterventionsTerminees: Number(u?.nbInterventionsTerminees ?? 0),
      tempsMoyenResolutionHeures: Number(u?.tempsMoyenResolutionHeures ?? 0),

      // détails (chargés plus tard)
      interventionsEnCours: [],
      dernieresInterventions: [],

      // stats détaillées (chargées via /technicien/{id}/stats)
      stats: undefined,

      // états UI (si tu les utilises)
      loadingInterventions: false,
      errorInterventions: null,
      loadingStats: false,
      errorStats: null,
    } as TechnicienUI;
  }








  formatTechnicienOption(t: TechnicienUI): string {
    const base = t.username ? t.username : t.nom;
    const service = (t.serviceUnite || t.categorie || '').trim();
    return service ? `${base} (${service})` : base;
  }

  /** Essaie de déduire le domaine du signalement à partir du typeEquipement */
  private guessDomaineFromDemande(d: Demande | null): 'INFO' | 'BUREAUTIQUE' | 'AUDIOVISUEL' | 'ELEC_CLIM' | 'PLOMBERIE' | 'AUTRE' {
    const raw = (d?.typeEquipement ?? '').toLowerCase();

    // exemples basés sur tes presets
    if (raw.includes('ordinateur') || raw.includes('routeur') || raw.includes('wi-fi') || raw.includes('switch') || raw.includes('serveur') || raw.includes('écran') || raw.includes('ecran') || raw.includes('clavier')) {
      return 'INFO';
    }
    if (raw.includes('imprimante') || raw.includes('scanner') || raw.includes('photocopieuse')) {
      return 'BUREAUTIQUE';
    }
    if (raw.includes('vidéoprojecteur') || raw.includes('videoprojecteur')) {
      return 'AUDIOVISUEL';
    }
    if (raw.includes('climatiseur') || raw.includes('onduleur') || raw.includes('ventilateur') || raw.includes('électricité') || raw.includes('electric')) {
      return 'ELEC_CLIM';
    }
    if (raw.includes('robinet') || raw.includes('plomb')) {
      return 'PLOMBERIE';
    }
    return 'AUTRE';
  }


  private filterTechniciensForDemande(d: Demande | null): TechnicienUI[] {
    const domaine = this.guessDomaineFromDemande(d);

    // Si aucun domaine clair → on propose tout
    if (domaine === 'AUTRE') return this.techniciens ?? [];

    const norm = (s: string) => (s ?? '').toLowerCase();

    return (this.techniciens ?? []).filter(t => {
      const blob = `${norm(t.serviceUnite ?? '')} ${norm(t.categorie ?? '')}`; // on cherche dedans
      switch (domaine) {
        case 'INFO':
          return blob.includes('informat') || blob.includes('réseau') || blob.includes('reseau');
        case 'BUREAUTIQUE':
          return blob.includes('bureaut') || blob.includes('photocop') || blob.includes('imprim');
        case 'AUDIOVISUEL':
          return blob.includes('audiovis') || blob.includes('pédagog') || blob.includes('pedagog');
        case 'ELEC_CLIM':
          return blob.includes('électric') || blob.includes('electric') || blob.includes('climat') || blob.includes('onduleur');
        case 'PLOMBERIE':
          return blob.includes('plomb') || blob.includes('robinet');
        default:
          return true;
      }
    });
  }



  private refreshTechnicienCategoriesAndFilters(): void {
    this.technicienCategories = Array.from(
      new Set((this.techniciens ?? []).map((t) => t.categorie).filter(Boolean))
    ).sort((a, b) => a.localeCompare(b));

    this.applyTechnicienFilters();
  }


  /* ========== ÉQUIPEMENTS ========== */

  onEquipementSearchChange(term: string): void {
    this.equipementSearchTerm = term.toLowerCase();
    this.filterEquipements();
  }

  onEquipementTypeSelectionChange(): void {
    if (this.equipementTypeSelection === 'AUTRE') {
      this.equipementForm.type = '';
    } else if (this.equipementTypeSelection) {
      this.equipementForm.type = this.equipementTypeSelection;
    } else {
      this.equipementForm.type = '';
    }
  }

  private filterEquipements(): void {
    let list = [...this.equipements];

    if (this.equipementEtatFilter !== 'TOUS') {
      list = list.filter((e) => e.etat === this.equipementEtatFilter);
    }

    if (this.equipementTypeFilter !== 'TOUS') {
      list = list.filter((e) => e.type === this.equipementTypeFilter);
    }

    if (this.equipementLocalisationFilter !== 'TOUS') {
      list = list.filter((e) => e.localisation === this.equipementLocalisationFilter);
    }

    if (this.equipementSearchTerm.trim().length > 0) {
      list = list.filter(
        (e) =>
          e.reference.toLowerCase().includes(this.equipementSearchTerm) ||
          e.type.toLowerCase().includes(this.equipementSearchTerm) ||
          e.localisation.toLowerCase().includes(this.equipementSearchTerm)
      );
    }

    this.filteredEquipements = list;
  }

  private refreshEquipementOptions(): void {
    this.equipementOptions = this.equipements.map((e) => e.reference);
  }

  getEtatLabel(etat: Equipement['etat']): string {
    if (etat === 'EN_SERVICE') return 'En service';
    if (etat === 'EN_PANNE') return 'En panne';
    return 'Hors service';
  }

  getPrioriteLabel(p: '' | 'BASSE' | 'MOYENNE' | 'HAUTE'): string {
    if (p === 'BASSE') return 'Basse';
    if (p === 'MOYENNE') return 'Moyenne';
    if (p === 'HAUTE') return 'Haute';
    return 'Non définie';
  }

  getPrioriteBadgeClass(p: '' | 'BASSE' | 'MOYENNE' | 'HAUTE'): string {
    if (p === 'HAUTE') return 'badge-prio-high';    // rouge
    if (p === 'MOYENNE') return 'badge-prio-med';   // jaune
    if (p === 'BASSE') return 'badge-prio-low';     // vert
    return 'badge-prio-none';
  }


  openEquipementForm(): void {
    this.isEditingEquipement = false;
    this.equipementTypeSelection = '';
    this.equipementForm = { reference: '', type: '', localisation: '', quantite: 0 };
    this.showEquipementModal = true;
  }

  editEquipement(e: Equipement): void {
    this.isEditingEquipement = true;

    if (this.equipementTypesUniversite.includes(e.type)) {
      this.equipementTypeSelection = e.type;
    } else {
      this.equipementTypeSelection = 'AUTRE';
    }

    this.equipementForm = {
      reference: e.reference,
      type: e.type,
      localisation: e.localisation,
      quantite: e.quantite,
    };

    this.showEquipementModal = true;
  }

  closeEquipementForm(): void {
    this.showEquipementModal = false;
  }

  saveEquipement(): void {
    if (!this.isEquipementFormValid) return;

    if (this.isEditingEquipement) {
      const index = this.equipements.findIndex((eq) => eq.reference === this.equipementForm.reference);
      if (index !== -1) {
        this.equipements[index] = {
          ...this.equipements[index],
          type: this.equipementForm.type,
          localisation: this.equipementForm.localisation,
          quantite: this.equipementForm.quantite ?? 0,
        };
      }
    } else {
      const exists = this.equipements.some((eq) => eq.reference === this.equipementForm.reference);
      if (exists) {
        alert("Un équipement avec cette référence existe déjà.");
        return;
      }
      this.equipements.push({
        reference: this.equipementForm.reference,
        type: this.equipementForm.type,
        localisation: this.equipementForm.localisation,
        quantite: this.equipementForm.quantite ?? 0,
        etat: 'EN_SERVICE',
      });
    }

    this.filterEquipements();
    this.refreshEquipementOptions();
    this.closeEquipementForm();
  }

  deleteEquipement(e: Equipement): void {
    const ok = confirm(`Supprimer l'équipement ${e.reference} ?`);
    if (!ok) return;
    this.equipements = this.equipements.filter((eq) => eq.reference !== e.reference);
    this.filterEquipements();
    this.refreshEquipementOptions();
  }

  /* ========== MAINTENANCE PRÉVENTIVE ========== */

  onPreventiveSearchChange(term: string): void {
    this.preventiveSearchTerm = term.toLowerCase();
    this.filterPreventives();
  }

  private filterPreventives(): void {
    let list = [...this.maintenancesPreventives];

    if (this.preventiveStatutFilter !== 'TOUS') {
      list = list.filter((m) => m.statut === this.preventiveStatutFilter);
    }

    if (this.preventiveSearchTerm.trim().length > 0) {
      list = list.filter(
        (m) =>
          (m.equipementReference ?? '').toLowerCase().includes(this.preventiveSearchTerm) ||
          (m.description ?? '').toLowerCase().includes(this.preventiveSearchTerm)
      );
    }

    this.filteredMaintenancesPreventives = list;
  }

  get nbPreventivesPlanifiees(): number {
    return this.maintenancesPreventives.filter((m) => m.statut === 'PLANIFIEE').length;
  }

  get nbPreventivesEnRetard(): number {
    return this.maintenancesPreventives.filter((m) => m.statut === 'EN_RETARD').length;
  }

  get nbPreventivesRealisees(): number {
    return this.maintenancesPreventives.filter((m) => m.statut === 'REALISEE').length;
  }

  openPreventiveForm(): void {
    this.newPreventive = {
      equipementReference: null,
      typeEquipement: null,
      frequence: null,
      prochaineDate: '',
      responsable: this.username,
      statut: 'PLANIFIEE',
      description: '',
    };

    this.showPreventiveForm = true;
  }

  closePreventiveForm(): void {
    this.showPreventiveForm = false;
    this.resetPreventiveForm();
  }

  get isNewPreventiveValid(): boolean {
    const p = this.newPreventive;
    return !!(p.equipementReference && p.typeEquipement && p.frequence && p.prochaineDate && p.description && p.responsable);
  }

  savePreventive(): void {
    if (!this.isNewPreventiveValid) return;

    const nextId =
      this.maintenancesPreventives.length === 0
        ? 1
        : Math.max(...this.maintenancesPreventives.map((m) => m.id)) + 1;

    const nouvelle: MaintenancePreventive = {
      id: nextId,
      equipementReference: this.newPreventive.equipementReference,
      typeEquipement: this.newPreventive.typeEquipement,
      frequence: this.newPreventive.frequence,
      prochaineDate: new Date(this.newPreventive.prochaineDate),
      responsable: this.newPreventive.responsable,
      statut: this.newPreventive.statut as StatutPreventive,
      description: this.newPreventive.description,
    };

    this.maintenancesPreventives.push(nouvelle);
    this.filterPreventives();
    this.closePreventiveForm();
  }

  private resetPreventiveForm(): void {
    this.newPreventive = {
      equipementReference: null,
      typeEquipement: null,
      frequence: null,
      prochaineDate: '',
      responsable: '',
      statut: null,
      description: '',
    };
  }

  saveNewPreventive(): void {
    this.savePreventive();
  }

  openPreventiveDetails(m: MaintenancePreventive): void {
    this.selectedPreventive = m;
    this.showPreventiveDetails = true;
  }

  closePreventiveDetails(): void {
    this.showPreventiveDetails = false;
    this.selectedPreventive = null;
  }

  /* ========== RAPPORTS & EXPORT ========= */

  exportRapportPdf(): void {
    if (!this.canExportRapport || !this.rapportDateDebut || !this.rapportDateFin) {
      console.warn('Export PDF annulé : dates invalides ou incomplètes.');
      return;
    }

    const doc = new jsPDF();

    doc.setFontSize(16);
    doc.text('Rapport d’activité de maintenance - UASZ', 14, 20);

    doc.setFontSize(11);
    doc.text(`Période : du ${this.rapportDateDebut} au ${this.rapportDateFin}`, 14, 30);

    doc.setLineWidth(0.4);
    doc.line(14, 34, 196, 34);

    let y = 44;
    doc.text(`Total des demandes : ${this.totalDemandes}`, 14, y); y += 7;
    doc.text(`En attente : ${this.enAttente}`, 14, y); y += 7;
    doc.text(`En cours : ${this.enCours}`, 14, y); y += 7;
    doc.text(`Résolues : ${this.resolues}`, 14, y); y += 10;

    doc.setFontSize(10);
    doc.text('Ce rapport est généré automatiquement à partir du tableau de bord Responsable.', 14, y);

    const fileName = `rapport-maintenance_${this.rapportDateDebut}_au_${this.rapportDateFin}.pdf`;
    doc.save(fileName);
  }
}
