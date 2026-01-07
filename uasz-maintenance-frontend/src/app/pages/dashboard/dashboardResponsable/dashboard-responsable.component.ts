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
import { EquipementStockService } from '../../../core/services/equipements-stock.service';
import { EquipementDetailsDto } from '../../../core/services/equipements-stock.service';
import { TechniciensService, TechnicienOptionDto } from '../../../core/services/techniciens.service';
import { TechnicienUI } from '../../../core/models/technicien-ui.model';
import {PreventivesService} from '../../../core/services/preventives.service';
import { MaintenancePreventive } from '../../../core/models/maintenance-preventive.model';







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
  urgence?: 'BASSE' | 'MOYENNE' | 'HAUTE' | string;

}

type TechnicienDetails = TechnicienUI & {
  interventionsEnCours: any[];
  dernieresInterventions: any[];
};


export interface NouvelleDemandeResponsableForm {
  titre: string;
  lieu: string;

  // select: valeur choisie OU "AUTRE"
  typeEquipement: string;

  // texte si AUTRE
  typeEquipementAutre?: string;

  // obligatoire
  urgence: '' | 'BASSE' | 'MOYENNE' | 'HAUTE';

  // optionnel
  description: string;

  // obligatoire
  imageFile: File | null;
  imagePreview: string | null;
}

// ===== STOCK EQUIPEMENTS (BACKEND) =====
export interface EquipementStockRowDto {
  typeId: number;
  type: string;
  quantiteTotale: number;
  enService: number;
  horsService: number;
}

export interface EquipementItemDto {
  id: number;
  statut: 'EN_SERVICE' | 'HORS_SERVICE' | string;
  localisation: string | null;
  dateMiseEnService: string | null; // LocalDate -> string côté Angular
}

export interface EquipementStockDetailsDto {
  typeId: number;
  type: string;
  description: string | null;
  dateAcquisition: string | null;

  quantiteTotale: number;
  enService: number;
  horsService: number;

  items: EquipementItemDto[];
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



interface DemandesParMois {
  mois: string;
  total: number;
}


/* ====================== COMPOSANT ====================== */

@Component({
  selector: 'app-dashboard-responsable',
  standalone: true,
  templateUrl: './dashboard-responsable.component.html',
  styleUrls: ['./dashboard-responsable.component.scss'],
  imports: [CommonModule, FormsModule, DatePipe],
})
export class DashboardResponsableComponent implements OnInit {

  // =====================================================
// MES DEMANDES (RESP) — état UI (filtres / recherche / pagination)
// =====================================================
  filtreUrgence: 'TOUTES' | 'BASSE' | 'MOYENNE' | 'HAUTE' = 'TOUTES';
  mesSearchTerm: string = '';

  mesDemandesPaged: MesDemandeResponsable[] = [];

  mesPageSize: number = 6;
  mesCurrentPage: number = 1;
  mesTotalPages: number = 1;

  // ====== MES DEMANDES (RESPONSABLE) ======
  mesDemandes: MesDemandeResponsable[] = [];
  mesDemandesFiltrees: MesDemandeResponsable[] = [];
  filtreStatut: 'TOUS' | 'EN_ATTENTE' | 'EN_COURS' | 'RESOLUE' = 'TOUS';



  loadingTechStats = false;
  errorTechStats: string | null = null;


  stockRows: EquipementStockRowDto[] = [];
  filteredStockRows: EquipementStockRowDto[] = [];

  loadingStock = false;
  errorStock: string | null = null;

  showStockDetailsModal = false;
  selectedStockDetails: EquipementDetailsDto | null = null;
  loadingStockDetails = false;
  errorStockDetails: string | null = null;

  equipementSearchTerm = '';

  selectedPreventiveTechnicienLabel = 'Non affecté';





  showMesNewDemandeModal = false;
  showMesDetailsModal = false;
  selectedMesDemande: MesDemandeResponsable | null = null;
  showMesImageInDetails = false;
  techniciens: TechnicienUI[] = [];
  techniciensAffectables: TechnicienUI[] = [];
  filteredTechniciens: TechnicienUI[] = [];

  showInterventionDetailsModal = false;
  loadingInterventionDetails = false;
  errorInterventionDetails: string | null = null;
  selectedInterventionDetails: any = null;

  loadingPreventives = false;
  errorPreventives: string | null = null;





  newMesDemande: NouvelleDemandeResponsableForm = {
    titre: '',
    lieu: '',
    typeEquipement: '',
    typeEquipementAutre: '',
    urgence: '',
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
    if (item === 'equipements') {
      this.loadStock();
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

  openInterventionDetails(interventionId: number): void {
    this.showInterventionDetailsModal = true;
    this.loadingInterventionDetails = true;
    this.errorInterventionDetails = null;
    this.selectedInterventionDetails = null;

    this.interventionsService.getById(interventionId).subscribe({
      next: (itv) => {
        this.selectedInterventionDetails = itv;
        this.loadingInterventionDetails = false;
      },
      error: (err) => {
        console.error('Erreur détails intervention:', err);
        this.errorInterventionDetails = "Impossible de charger les détails de l'intervention.";
        this.loadingInterventionDetails = false;
      }
    });
  }

  closeInterventionDetailsModal(): void {
    this.showInterventionDetailsModal = false;
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
          new Set(
            this.techniciens
              .map(t => t.categorie ?? '')
              .filter(c => c.trim().length > 0)
          )
        ).sort((a, b) => a.localeCompare(b));


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



  private loadStock(): void {
    this.loadingStock = true;
    this.errorStock = null;

    this.equipementStockService.getStock().subscribe({
      next: (rows) => {
        this.stockRows = rows ?? [];
        this.applyStockFilter();
        this.loadingStock = false;
      },
      error: (err) => {
        console.error('Erreur chargement stock:', err);
        this.stockRows = [];
        this.filteredStockRows = [];
        this.errorStock = "Impossible de charger le stock.";
        this.loadingStock = false;
      },
    });
  }

  onEquipementSearchChange(term: string): void {
    this.equipementSearchTerm = (term ?? '').toLowerCase().trim();
    this.applyStockFilter();
  }

  private applyStockFilter(): void {
    const q = this.equipementSearchTerm;

    if (!q) {
      this.filteredStockRows = [...this.stockRows];
      return;
    }

    this.filteredStockRows = (this.stockRows ?? []).filter((r) =>
      (r.type ?? '').toLowerCase().includes(q)
    );
  }


  openStockDetails(typeId: number): void {
    this.showStockDetailsModal = true;
    this.loadingStockDetails = true;
    this.errorStockDetails = null;
    this.selectedStockDetails = null;

    this.equipementStockService.getDetails(typeId).subscribe({
      next: (details) => {
        this.selectedStockDetails = details;
        this.loadingStockDetails = false;
      },
      error: (err) => {
        console.error('Erreur détails stock:', err);
        this.errorStockDetails = "Impossible de charger les détails de cet équipement.";
        this.loadingStockDetails = false;
      }
    });
  }

  closeStockDetailsModal(): void {
    this.showStockDetailsModal = false;
    this.selectedStockDetails = null;
    this.errorStockDetails = null;
    this.loadingStockDetails = false;
  }



  private applyStockFilters(): void {
    const q = (this.equipementSearchTerm || '').trim().toLowerCase();
    let list = [...this.equipementsStock];

    if (q) {
      list = list.filter((e) => (e.type || '').toLowerCase().includes(q));
    }

    // tes anciens filtres "etat/type" ne sont plus utiles ici (car on affiche par type)
    this.filteredEquipementsStock = list;
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

  equipementEtatFilter: 'TOUS' | 'EN_SERVICE' | 'EN_PANNE' | 'HORS_SERVICE' = 'TOUS';
  equipementTypeFilter: 'TOUS' | string = 'TOUS';
  equipementLocalisationFilter: 'TOUS' | string = 'TOUS';

  equipementTypes: string[] = ['PC bureau', 'Imprimante', 'Vidéo-projecteur'];
  equipementLocalisations: string[] = ['Salle info 1', 'Scolarité', 'Amphi A'];

// STOCK (réel)
  equipementsStock: any[] = [];
  filteredEquipementsStock: any[] = [];


// modal détails
  showEquipementDetailsModal = false;
  selectedEquipementDetails: any = null;
  loadingEquipementDetails = false;
  errorEquipementDetails: string | null = null;


  filteredEquipements: Equipement[] = [];

  showEquipementModal = false;
  isEditingEquipement = false;

  equipementTypesUniversite: string[] = [
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

  resolveImageUrl(v?: string | null): string | undefined {
    const value = (v ?? '').trim();
    if (!value) return undefined;

    // déjà URL complète
    if (/^https?:\/\//i.test(value)) return value;

    // si "/uploads/..."
    if (value.startsWith('/')) return `${this.serverBaseUrl}${value}`;

    // fallback
    return `${this.serverBaseUrl}/${value}`;
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

  maintenancesPreventives: MaintenancePreventive[] = [];
  filteredMaintenancesPreventives: MaintenancePreventive[] = [];

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
  selectedTechnicien: TechnicienDetails | null = null;


  showPreventiveDetails = false;
  selectedPreventive: MaintenancePreventive | null = null;
// Lightbox
  isImageLightboxOpen = false;
  lightboxImageSrc: string | null = null;

  techniciensOptions: TechnicienOptionDto[] = [];
  loadingTechniciens = false;
  errorTechniciens: string | null = null;

// dans ton form / model de création
  selectedTechnicienId: number | null = null;






  /* ========== CONSTRUCTEUR / INIT ========== */
  constructor(
    private authService: AuthService,
    private router: Router,
    private pannesRespApi: PannesResponsableService,
    private utilisateursService: UtilisateursService,
    private interventionsService: InterventionsService,
    private equipementStockService: EquipementStockService,
    private techniciensService: TechniciensService,
    private preventivesService: PreventivesService
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
        this.appliquerFiltresMesDemandes();

        this.filterPreventives();
        this.loadStock();
        this.loadEquipementsStock();
        this.loadMaintenancesPreventives();
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

  // ==============================
// STOCK - Création type + quantité
// ==============================
  loadingCreateStockType = false;
  errorCreateStockType: string | null = null;
  showCreateStockTypeModal = false;
  createStockLoading = false;
  createStockError: string | null = null;


  stockCreateForm = {
    libelle: '',
    description: '',
    quantite: 1,
    statut: 'EN_SERVICE' as 'EN_SERVICE' | 'HORS_SERVICE',
    localisation: ''
  };


  createStockForm: { type: string; quantite: number; description: string } = {
    type: '',
    quantite: 1,
    description: ''
  };





  get isStockCreateFormValid(): boolean {
    const f = this.stockCreateForm;
    return !!(
      f.libelle.trim() &&
      f.quantite !== null &&
      f.quantite > 0 &&
      f.localisation.trim()
    );
  }

  openCreateStockTypeModal(): void {
    this.createStockForm = { type: '', quantite: 1, description: '' };
    this.showCreateStockTypeModal = true;
  }

  closeCreateStockTypeModal(): void {
    this.showCreateStockTypeModal = false;
  }

  normalizeStockQuantity(): void {
    let q = Number(this.createStockForm.quantite);

    if (!Number.isFinite(q) || q < 1) {
      this.createStockForm.quantite = 0;
      return;
    }

    this.createStockForm.quantite = Math.floor(q);
  }



  isCreateStockInvalid(): boolean {
    const type = (this.createStockForm.type ?? '').trim();

    const quantite = Number(this.createStockForm.quantite);

    if (!type) return true;
    if (!Number.isInteger(quantite)) return true;
    if (quantite < 1) return true;

    return false;
  }

  private mapToTechnicienUI(dto: any): TechnicienUI {
    return {
      id: dto.id,
      nom: dto.nom ?? dto.username ?? 'Technicien',
      username: dto.username ?? null,

      serviceUnite: dto.serviceUnite ?? null,
      categorie: dto.categorie ?? dto.specialite ?? 'Général',
      sousCategorie: dto.sousCategorie ?? null,

      specialites: dto.specialites ?? (dto.specialite ? [dto.specialite] : []),

      disponible: dto.disponible ?? true,
      nbInterventionsEnCours: dto.nbInterventionsEnCours ?? 0,
      nbInterventionsTerminees: dto.nbInterventionsTerminees ?? 0,
      tempsMoyenResolutionHeures: dto.tempsMoyenResolutionHeures ?? 0,

      stats: dto.stats ?? null,
    };
  }

  filterMaintenancesPreventives(): void {
    const q = (this.preventiveSearchTerm ?? '').trim().toLowerCase();

    if (!q) {
      this.filteredMaintenancesPreventives = [...this.maintenancesPreventives];
      return;
    }

    this.filteredMaintenancesPreventives = this.maintenancesPreventives.filter(m =>
      (m.equipementReference ?? '').toLowerCase().includes(q) ||
      (m.typeEquipement ?? '').toLowerCase().includes(q) ||
      (m.responsable ?? '').toLowerCase().includes(q)
    );
  }

  loadMaintenancesPreventives(): void {
    this.loadingPreventives = true;
    this.errorPreventives = null;

    this.preventivesService.getAll().subscribe({
      next: (data) => {
        this.maintenancesPreventives = data ?? [];
        this.filteredMaintenancesPreventives = [...this.maintenancesPreventives];
        this.loadingPreventives = false;
      },
      error: (err: any) => {
        console.error('Erreur chargement maintenances préventives:', err);
        this.maintenancesPreventives = [];
        this.filteredMaintenancesPreventives = [];
        this.errorPreventives = "Impossible de charger les maintenances préventives.";
        this.loadingPreventives = false;
      }
    });
  }





  createStockTypeWithQuantity(): void {
    const payload = {
      libelle: (this.createStockForm.type || '').trim(),
      description: (this.createStockForm.description || '').trim() || null,
      quantite: Number(this.createStockForm.quantite)
    };

    if (!payload.libelle || payload.quantite < 1) return;

    this.equipementStockService.createTypeWithQuantity(payload).subscribe({
      next: () => {
        this.closeCreateStockTypeModal();
        this.loadEquipementsStock(); // recharge la liste après ajout
      },
      error: (err: any) => {
        console.error(err);
        alert("Impossible d'ajouter l'équipement.");
      }
    });
  }

  private mapOptionToTechnicienUI(dto: TechnicienOptionDto): TechnicienUI {
    const displayName =
      `${dto.prenom ?? ''} ${dto.nom ?? ''}`.trim() || dto.username;

    return {
      id: dto.id,
      nom: displayName,
      serviceUnite: dto.serviceUnite ?? null,

      // ✅ champs attendus par ton model complet
      categorie: dto.serviceUnite ?? 'Général',
      specialites: dto.serviceUnite ? [dto.serviceUnite] : [],
      disponible: true,
      nbInterventionsEnCours: 0,
      nbInterventionsTerminees: 0,
      tempsMoyenResolutionHeures: 0,
    };
  }


  loadTechniciensForPreventive(): void {
    this.loadingTechniciens = true;

    this.techniciensService.getTechniciens().subscribe({
      next: (data: TechnicienOptionDto[]) => {
        this.techniciens = (data ?? []).map(d => this.mapOptionToTechnicienUI(d));
        this.loadingTechniciens = false;
      },
      error: (err) => {
        console.error('Erreur chargement techniciens:', err);
        this.techniciens = [];
        this.loadingTechniciens = false;
      }
    });
  }

  loadEquipementsStock(): void {
    this.equipementStockService.getStock().subscribe({
      next: (rows) => {
        this.equipementsStock = rows ?? [];
        this.filteredEquipementsStock = [...this.equipementsStock];

        // Si tu veux garder une liste pour le select "Tous les types"
        this.equipementTypes = Array.from(
          new Set(this.equipementsStock.map(r => r.type))
        ).sort();
      },
      error: (err: any) => {
        console.error(err);
        this.equipementsStock = [];
        this.filteredEquipementsStock = [];
        this.equipementTypes = [];
      }
    });
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
    return (list ?? []).map(p => {

      // ✅ LOG CORRECT (p existe ici)
      console.log('PRIORITE API =', p.priorite, 'ID =', p.id);

      return {
        id: p.id,
        titre: p.titre,
        demandeurNom: (p as any).demandeurNom ?? p.signaleePar ?? '—',
        lieu: p.lieu,
        typeEquipement: p.typeEquipement,
        description: p.description,
        dateCreation: this.safeDateIso(p),
        statut: this.mapStatutApiToUi(p.statut),

        // ✅ URGENCE DEMANDEUR (clé importante)
        urgenceDemandeur: this.mapPrioriteApiToUrgenceUi(p.priorite),

        // (si tu utilises encore ce champ ailleurs)
        urgence: this.mapPrioriteApiToUrgenceUi(p.priorite),

        urgenceResponsable: 'NON_DEFINIE',

        imageUrl: (p as any).imageUrl ?? (p as any).imagePath ?? undefined,
      };
    });
  }

  getUrgenceListClassAny(u?: string | null): string {
    const v = (u ?? '').toString().toUpperCase();

    if (v === 'BASSE') return 'urgency-low';
    if (v === 'MOYENNE') return 'urgency-medium';
    if (v === 'HAUTE') return 'urgency-high';

    return 'urgency-none';
  }





  private mapPannesToMesDemandes(list: PanneDto[]): MesDemandeResponsable[] {
    return (list ?? []).map((p) => {
      const raw = p.imageUrl ?? p.imagePath; // string | null | undefined

      return {
        id: p.id,
        titre: p.titre ?? '',
        dateCreation: this.safeDateIso(p),
        lieu: p.lieu ?? '',
        statut: this.mapStatutApiToUi(p.statut),

        typeEquipement: p.typeEquipement ?? '',
        description: p.description ?? '',

        // ✅ string | undefined garanti
        imageUrl: this.resolveImageUrl(raw),

        urgence: (p.priorite ?? undefined) as any,
      };
    });
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

  private mapPrioriteApiToUrgenceUi(
    p: PrioriteApi | null | undefined | any
  ): 'BASSE' | 'MOYENNE' | 'HAUTE' | null {
    if (p === 'BASSE' || p === 'MOYENNE' || p === 'HAUTE') return p;
    return null; // ✅ jamais undefined
  }


  private safeDateIso(p: any): Date {
    const iso =
      p?.dateSignalement ||   // ✅ PRIORITAIRE
      p?.dateCreation ||
      p?.createdAt ||
      p?.created_at;

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


  private appliquerFiltresMesDemandes(): void {
    const list = Array.isArray(this.mesDemandes) ? [...this.mesDemandes] : [];

    const statut = this.filtreStatut || 'TOUS';
    const urgence = this.filtreUrgence || 'TOUTES';
    const q = (this.mesSearchTerm || '').trim().toLowerCase();

    let filtered = list;

    // filtre statut
    if (statut !== 'TOUS') {
      filtered = filtered.filter(d => (d?.statut ?? '') === statut);
    }

    // filtre urgence (si "urgence" existe)
    if (urgence !== 'TOUTES') {
      filtered = filtered.filter(d => (d?.urgence ?? '') === urgence);
    }

    // recherche (titre/lieu/statut)
    if (q) {
      filtered = filtered.filter(d => {
        const titre = (d?.titre ?? '').toLowerCase();
        const lieu = (d?.lieu ?? '').toLowerCase();
        const st = (d?.statut ?? '').toLowerCase();
        return titre.includes(q) || lieu.includes(q) || st.includes(q);
      });
    }

    // tri date desc (si dateCreation existe)
    filtered.sort((a: any, b: any) => {
      const da = a?.dateCreation ? new Date(a.dateCreation).getTime() : 0;
      const db = b?.dateCreation ? new Date(b.dateCreation).getTime() : 0;
      return db - da;
    });

    this.mesDemandesFiltrees = filtered;

    // pagination
    this.mesTotalPages = Math.max(1, Math.ceil(filtered.length / this.mesPageSize));
    if (this.mesCurrentPage > this.mesTotalPages) this.mesCurrentPage = this.mesTotalPages;

    const start = (this.mesCurrentPage - 1) * this.mesPageSize;
    const end = start + this.mesPageSize;
    this.mesDemandesPaged = filtered.slice(start, end);
  }


  changerFiltreUrgence(u: 'TOUTES' | 'BASSE' | 'MOYENNE' | 'HAUTE'): void {
    this.filtreUrgence = u;
    this.mesCurrentPage = 1;
    this.appliquerFiltresMesDemandes();
  }

  onMesSearchChange(value: string): void {
    this.mesSearchTerm = value ?? '';
    this.mesCurrentPage = 1;
    this.appliquerFiltresMesDemandes();
  }

// =========================
// MES DEMANDES - Pagination actions
// =========================

  mesGoToPreviousPage(): void {
    if (this.mesCurrentPage > 1) {
      this.mesCurrentPage--;
      this.appliquerFiltresMesDemandes();
    }
  }

  mesGoToNextPage(): void {
    if (this.mesCurrentPage < this.mesTotalPages) {
      this.mesCurrentPage++;
      this.appliquerFiltresMesDemandes();
    }
  }



  changerFiltreStatut(statut: 'TOUS' | 'EN_ATTENTE' | 'EN_COURS' | 'RESOLUE'): void {
    this.filtreStatut = statut;
    this.appliquerFiltresMesDemandes();
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
      typeEquipementAutre: '',
      urgence: '',
      description: '',
      imageFile: null,
      imagePreview: null,
    };
  }
  countMesParStatut(statut: 'EN_ATTENTE' | 'EN_COURS' | 'RESOLUE' | 'OUVERTE'): number {
    const list = (this as any).mesDemandesFiltrees?.length
      ? (this as any).mesDemandesFiltrees
      : this.mesDemandes;

    const target = statut.toUpperCase();

    return (list || []).filter((d: any) => {
      const s = (d?.statut || '').toUpperCase();

      // si ton backend renvoie OUVERTE au lieu de EN_ATTENTE
      if (target === 'EN_ATTENTE') return s === 'EN_ATTENTE' || s === 'OUVERTE';
      return s === target;
    }).length;
  }


  // ==============================
// Options select équipements (comme Demandeur)
// ==============================
  equipementOptions: string[] = [
    'Ordinateur',
    'Imprimante',
    'Vidéoprojecteur',
    'Scanner',
    'Routeur / Switch',
    'Climatiseur',
    'Groupe électrogène',
    'Micro / Sono',
    'Autre matériel',
  ];

// ==============================
// Etat loading du bouton
// ==============================
  loadingMesCreate = false;

// ==============================
// Appelé sur ngModelChange (juste pour rafraîchir l'état)
// ==============================
  onMesFormChange(): void {
    // Rien à faire ici pour l’instant.
    // On garde la méthode pour éviter les erreurs template
    // et permettre des améliorations (validation live).
  }

// ==============================
// Quand on change le select équipement
// ==============================
  onMesEquipementChange(value: string): void {
    this.newMesDemande.typeEquipement = value;

    // ✅ si on quitte "Autre", on vide "Précisez"
    if (value !== 'Autre') {
      this.newMesDemande.typeEquipementAutre = '';
    }

    // si tu utilises une variable computed/filtre/pagination, tu peux laisser vide
    // sinon rien à faire: Angular réévaluera isMesNewDemandeValid() tout seul
  }


// ==============================
// Validation : tous obligatoires sauf description
// + si typeEquipement=AUTRE alors typeEquipementAutre obligatoire
// ==============================
  isMesNewDemandeValid(): boolean {
    const titre = (this.newMesDemande.titre || '').trim();
    const lieu = (this.newMesDemande.lieu || '').trim();
    const typeEquipement = (this.newMesDemande.typeEquipement || '').trim();
    const urgence = (this.newMesDemande.urgence || '').trim();

    const autre = (this.newMesDemande as any).typeEquipementAutre
      ? String((this.newMesDemande as any).typeEquipementAutre).trim()
      : '';

    if (!titre || !lieu || !typeEquipement || !urgence) return false;
    if (typeEquipement === 'Autre' && !autre) return false;
    if (!this.newMesDemande.imageFile) return false;
    if (this.mesImageError) return false;

    return true;
  }



  removeMesSelectedImage(): void {
    this.newMesDemande.imageFile = null;
    this.newMesDemande.imagePreview = null;
    this.mesImageError = '';
  }


  submitMesNewDemande(): void {
    // ✅ On garde une validation simple + propre
    const titre = (this.newMesDemande.titre || '').trim();
    const lieu = (this.newMesDemande.lieu || '').trim();
    const typeEquipement = (this.newMesDemande.typeEquipement || '').trim();
    const description = (this.newMesDemande.description || '').trim();

    // 🔥 Si tu as bien ajouté ce champ dans le form (typeEquipementAutre)
    const typeEquipementAutre = (this.newMesDemande as any).typeEquipementAutre
      ? String((this.newMesDemande as any).typeEquipementAutre).trim()
      : '';

    // ⚠️ Champs obligatoires: titre, lieu, typeEquipement + image
    // + si typeEquipement = "Autre" => typeEquipementAutre devient obligatoire
    if (!titre || !lieu || !typeEquipement) return;
    if (typeEquipement === 'Autre' && !typeEquipementAutre) return;
    if (!this.newMesDemande.imageFile) return;

    // ✅ valeur finale à envoyer à la BD (comme Demandeur)
    const typeEquipementFinal =
      typeEquipement === 'Autre'
        ? `AUTRE: ${typeEquipementAutre}` // ou juste typeEquipementAutre si tu préfères
        : typeEquipement;

    const fd = new FormData();
    fd.append('titre', titre);
    fd.append('description', description); // optionnel donc OK même vide
    fd.append('typeEquipement', typeEquipementFinal);
    fd.append('lieu', lieu);
    fd.append('priorite', this.newMesDemande.urgence);


    if (this.newMesDemande.imageFile) {
      fd.append('image', this.newMesDemande.imageFile);
    }

    // ✅ Responsable peut créer une panne
    this.pannesRespApi.createPanne(fd).subscribe({
      next: () => {
        // reload safe
        this.chargerDemandesDepuisApi();

        // reload mes demandes aussi
        this.pannesRespApi.getMyPannes().subscribe({
          next: (mine) => {
            this.mesDemandes = this.mapPannesToMesDemandes(mine);
            this.appliquerFiltresMesDemandes();
          },
          error: (e) => console.error('Erreur rechargement mes pannes:', e),
        });

        this.closeMesNewDemandeModal();
      },
      error: (err) => console.error('Erreur création panne:', err),
    });
  }

  ouvrirDetailDemande(demande: MesDemandeResponsable): void {
    if (!demande) return;

    this.selectedMesDemande = { ...demande };

    // ✅ si imageUrl est déjà en base -> on la "résout" proprement
    this.selectedMesDemande.imageUrl = this.resolveImageUrl(this.selectedMesDemande.imageUrl);

    this.showMesDetailsModal = true;
    this.showMesImageInDetails = false;
  }





  closeMesDetailsModal(): void {
    this.showMesDetailsModal = false;
    this.selectedMesDemande = null;
    this.showMesImageInDetails = false;
  }

  toggleMesImageDetails(): void {
    this.showMesImageInDetails = !this.showMesImageInDetails;
  }

  libelleUrgence(p?: string): string {
    if (!p) return 'Urgence moyenne';
    const v = String(p).toUpperCase();
    if (v === 'HAUTE') return 'Urgence haute';
    if (v === 'BASSE') return 'Urgence basse';
    return 'Urgence moyenne';
  }

  urgenceChipClass(p?: string): string {
    if (!p) return 'mid';
    const v = String(p).toUpperCase();
    if (v === 'HAUTE') return 'high';
    if (v === 'BASSE') return 'low';
    return 'mid';
  }

  /** statut: EN_ATTENTE / EN_COURS / RESOLUE (ou OUVERTE...) */
  libelleStatut(statut?: string): string {
    const s = (statut || '').toUpperCase();
    if (s === 'EN_ATTENTE' || s === 'OUVERTE') return 'En attente';
    if (s === 'EN_COURS') return 'En cours';
    if (s === 'RESOLUE') return 'Résolue';
    return statut || '-';
  }

  badgeClass(statut?: string): string {
    const s = (statut || '').toUpperCase();
    if (s === 'EN_ATTENTE' || s === 'OUVERTE') return 'pending';
    if (s === 'EN_COURS') return 'progress';
    if (s === 'RESOLUE') return 'done';
    return 'pending';
  }


  mesImageError: string = '';
  private readonly MES_MAX_IMAGE_BYTES = 2 * 1024 * 1024; // 2 Mo

  onMesFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input?.files?.[0] ?? null;

    this.mesImageError = '';

    if (!file) return;

    // ✅ contrôle taille
    if (file.size > this.MES_MAX_IMAGE_BYTES) {
      this.mesImageError = "Image trop volumineuse. La taille maximale autorisée est de 2 Mo.";
      // reset
      this.newMesDemande.imageFile = null;
      this.newMesDemande.imagePreview = null;
      input.value = ''; // important pour pouvoir re-sélectionner le même fichier
      return;
    }

    // ✅ OK
    this.newMesDemande.imageFile = file;

    const reader = new FileReader();
    reader.onload = () => (this.newMesDemande.imagePreview = reader.result as string);
    reader.readAsDataURL(file);
  }


  /* ========== DÉTAILS DEMANDE (MODALE GLOBAL) ========== */

  openDemandeDetails(d: Demande): void {
    this.selectedDemande = { ...d };

    // 🔥 sécurité : si jamais urgenceDemandeur n’est pas là, fallback sur urgence
    this.selectedDemande.urgenceDemandeur =
      this.selectedDemande.urgenceDemandeur ?? this.selectedDemande.urgence ?? null;

    this.selectedDemande.imageUrl = this.resolveImageUrl(
      this.selectedDemande.imageUrl || (this.selectedDemande as any).imagePath
    );

    this.modalTechnicienId = null;
    this.modalCommentaire = '';
    this.showImageInDetails = false;
    this.markAsResolved = d.statut === 'RESOLUE';
    this.showDetailsModal = true;

    this.modalUrgenceResponsable = '';
    const filtered = this.filterTechniciensForDemande(this.selectedDemande);
    this.techniciensAffectables = (filtered?.length ? filtered : [...this.techniciens]);
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
          (t.categorie ?? '').toLowerCase().includes((this.technicienSearchTerm ?? '').toLowerCase())
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
    const safeCategorie = t.categorie ?? 'Général';

    this.selectedTechnicien = {
      ...t,
      categorie: safeCategorie,          // ✅ force string
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

        this.selectedTechnicien.interventionsEnCours =
          this.mapInterventionsToUi(enCours);

        this.selectedTechnicien.dernieresInterventions =
          this.mapInterventionsToUi(recentes);

        this.loadingTechInterventions = false;
      },
      error: (err: any) => {
        console.error('Erreur chargement interventions technicien:', err);
        this.errorTechInterventions =
          "Impossible de charger les interventions du technicien.";
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
      new Set(
        (this.techniciens ?? [])
          .map(t => (t.categorie ?? '').trim())
          .filter(c => c.length > 0)
      )
    ).sort((a, b) => a.localeCompare(b));

    this.applyTechnicienFilters();
  }



  /* ========== ÉQUIPEMENTS ========== */



  onEquipementTypeSelectionChange(): void {
    if (this.equipementTypeSelection === 'AUTRE') {
      this.equipementForm.type = '';
    } else if (this.equipementTypeSelection) {
      this.equipementForm.type = this.equipementTypeSelection;
    } else {
      this.equipementForm.type = '';
    }
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





  closeEquipementDetails(): void {
    this.showEquipementDetailsModal = false;
    this.selectedEquipementDetails = null;
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
    // reset form (respecte le type)
    this.newPreventive = {
      equipementReference: null,
      typeEquipement: null,              // ⬅️ on garde, même si champ retiré côté UI
      frequence: null,
      prochaineDate: '',
      responsable: this.username || 'Responsable',
      statut: 'PLANIFIEE',               // ⬅️ obligatoire par ton type
      description: '',
    };

    // reset technicien sélectionné
    this.modalTechnicienId = null;       // ⬅️ c’est celui utilisé par le select "Technicien affecté"

    // ouvrir modale
    this.showPreventiveForm = true;

    // charger techniciens
    this.loadTechniciensForPreventive();
  }



  closePreventiveForm(): void {
    this.showPreventiveForm = false;
    this.resetPreventiveForm();
  }
  loadTechniciensForSelect(): void {
    this.loadingTechniciens = true;

    this.techniciensService.getTechniciens().subscribe({
      next: (data: any[]) => {
        this.techniciens = (data || []).map((t: any) => this.mapToTechnicienUI(t));
        this.loadingTechniciens = false;
      },
      error: (err: any) => {
        this.loadingTechniciens = false;
        console.error(err);
      },
    });
  }



  get isNewPreventiveValid(): boolean {
    return !!(
      this.newPreventive.equipementReference &&
      this.modalTechnicienId &&
      this.newPreventive.frequence &&
      this.newPreventive.prochaineDate &&
      this.newPreventive.description?.trim()
    );
  }



  savePreventive(): void {
    if (!this.isNewPreventiveValid) return;

    const nextId =
      this.maintenancesPreventives.length === 0
        ? 1
        : Math.max(...this.maintenancesPreventives.map((m) => m.id)) + 1;

    // ✅ garanties (car ton validateur dit que c'est ok)
    const equipementReference = this.newPreventive.equipementReference ?? '';
    const frequence = this.newPreventive.frequence ?? '';
    const prochaineDate = this.newPreventive.prochaineDate; // "YYYY-MM-DD"

    const nouvelle: MaintenancePreventive = {
      id: nextId,
      equipementReference,
      typeEquipement: this.newPreventive.typeEquipement ?? null, // si tu l'as gardé optionnel
      frequence,
      prochaineDate, // ✅ string (pas Date)
      responsable: this.newPreventive.responsable,
      statut: (this.newPreventive.statut ?? 'PLANIFIEE') as StatutPreventive,
      description: this.newPreventive.description,
      technicienId: this.modalTechnicienId,
    };

    this.maintenancesPreventives = [nouvelle, ...this.maintenancesPreventives];
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
    if (!this.isNewPreventiveValid) return;

    // ✅ garanties (car ton validateur dit que c'est ok)
    const equipementReference = this.newPreventive.equipementReference ?? '';
    const frequence = this.newPreventive.frequence ?? '';
    const prochaineDate = this.newPreventive.prochaineDate; // "YYYY-MM-DD"
    const technicienId = this.modalTechnicienId;

    if (!technicienId) {
      // sécurité (normalement ton validator l’empêche déjà)
      console.warn('Technicien non sélectionné');
      return;
    }

    // ✅ payload backend (adapte les noms si ton backend utilise d’autres champs)
    const payload = {
      equipementReference,
      typeEquipement: this.newPreventive.typeEquipement, // ✅ maintenant rempli
      frequence,
      prochaineDate,
      responsable: this.newPreventive.responsable,
      statut: (this.newPreventive.statut ?? 'PLANIFIEE'),
      description: this.newPreventive.description,
      technicienId
    };


    console.log('payload preventive', payload);

    this.loadingPreventives = true;
    this.errorPreventives = null;

    this.preventivesService.create(payload).subscribe({
      next: () => {
        this.loadingPreventives = false;

        this.closePreventiveForm();
        // ✅ recharge depuis la BD puis remplit filteredMaintenancesPreventives
        this.loadMaintenancesPreventives();
      },
      error: (err: any) => {
        console.error('Erreur création maintenance préventive:', err);
        this.loadingPreventives = false;
        this.errorPreventives = "Impossible d'enregistrer la maintenance préventive.";
      }
    });
  }


  openPreventiveDetails(m: MaintenancePreventive): void {
    this.selectedPreventive = m; // (si tu as déjà ça)

    // ✅ label technicien (nom + (serviceUnite/categorie))
    const t = (this.techniciens ?? []).find(x => x.id === m.technicienId);

    if (!m.technicienId) {
      this.selectedPreventiveTechnicienLabel = 'Non affecté';
    } else if (t) {
      const spec = t.serviceUnite || t.categorie || '';
      this.selectedPreventiveTechnicienLabel = spec ? `${t.nom} (${spec})` : t.nom;
    } else {
      // cas où techniciens pas chargés / ou maintenance vient du backend sans liste techniciens déjà en mémoire
      this.selectedPreventiveTechnicienLabel = `Technicien #${m.technicienId}`;
    }

    this.showPreventiveDetails = true; // adapte à ton bool
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
