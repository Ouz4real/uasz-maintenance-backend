// src/app/pages/dashboard/dashboardResponsable/dashboard-responsable.component.ts

import { Component, OnInit, HostListener } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import jsPDF from 'jspdf';
import { AuthService } from '../../../core/services/auth';

/* ====================== INTERFACES ====================== */

interface Demande {
  id: number;
  titre: string;
  demandeurNom: string;
  lieu: string;
  typeEquipement: string;
  description: string;
  dateCreation: Date;
  statut: 'EN_ATTENTE' | 'EN_COURS' | 'RESOLUE';
  urgence: 'BASSE' | 'MOYENNE' | 'HAUTE' | 'NON_DEFINIE' | null;
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
  interventionsEnCours?: Intervention[];
  dernieresInterventions?: Intervention[];
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

/* ====================== COMPOSANT ====================== */

@Component({
  selector: 'app-dashboard-responsable',
  standalone: true,
  templateUrl: './dashboard-responsable.component.html',
  styleUrls: ['./dashboard-responsable.component.scss'],
  imports: [CommonModule, FormsModule, DatePipe]
})
export class DashboardResponsableComponent implements OnInit {

  /* ========== INFOS UTILISATEUR / LAYOUT ========== */

  username: string = 'Responsable';
  usernameInitial: string = 'R';
  userMenuOpen = false;

  // Modale confirmation déconnexion
  showLogoutConfirm = false;

  // Modal "Nouvelle maintenance préventive"
  showPreventiveForm = false;

  activeItem:
    | 'dashboard'
    | 'techniciens'
    | 'equipements'
    | 'preventives'
    | 'rapports'
    | 'help' = 'dashboard';

  /* ========== DONNÉES DEMANDES / DASHBOARD ========== */

  demandes: Demande[] = [
    {
      id: 1,
      titre: 'Ordinateur ne démarre plus',
      demandeurNom: 'Alioune Diop',
      lieu: 'Salle info 1',
      typeEquipement: 'PC bureau',
      description: 'L’ordinateur ne s’allume plus malgré plusieurs tentatives.',
      dateCreation: new Date('2025-02-01T09:30:00'),
      statut: 'EN_ATTENTE',
      urgence: 'HAUTE',
      imageUrl: null
    },
    {
      id: 2,
      titre: 'Imprimante bloque les feuilles',
      demandeurNom: 'Fatou Ndiaye',
      lieu: 'Scolarité',
      typeEquipement: 'Imprimante',
      description: 'Blocages fréquents lors des impressions massives.',
      dateCreation: new Date('2025-02-02T11:10:00'),
      statut: 'EN_COURS',
      urgence: 'MOYENNE',
      imageUrl: null
    },
    {
      id: 3,
      titre: 'Vidéo-projecteur à vérifier',
      demandeurNom: 'M. Sarr',
      lieu: 'Amphi A',
      typeEquipement: 'Vidéo-projecteur',
      description: 'Image floue, lampe peut-être en fin de vie.',
      dateCreation: new Date('2025-02-05T15:45:00'),
      statut: 'RESOLUE',
      urgence: 'BASSE',
      imageUrl: null
    }
  ];

  // Filtres
  statusFilter: 'TOUTES' | 'EN_ATTENTE' | 'EN_COURS' | 'RESOLUE' = 'TOUTES';
  urgenceFilter: 'TOUTES' | 'BASSE' | 'MOYENNE' | 'HAUTE' = 'TOUTES';
  searchTerm: string = '';

  // Listes filtrées + pagination
  filteredDemandes: Demande[] = [];
  paginatedDemandes: Demande[] = [];
  pageSize = 5;
  currentPage = 1;
  totalPages = 1;
  totalPagesArray: number[] = [];
  pageStartIndex = 0;
  pageEndIndex = 0;

  // Statistiques globales
  totalDemandes = 0;
  enAttente = 0;
  enCours = 0;
  resolues = 0;

  // Demandes par mois (simulé)
  demandesParMois: DemandesParMois[] = [
    { mois: 'Jan', total: 8 },
    { mois: 'Fév', total: 12 },
    { mois: 'Mar', total: 10 },
    { mois: 'Avr', total: 6 }
  ];
  maxDemandesParMois = 12;

  // Répartition statuts (en %)
  statusPercentEnAttente = 0;
  statusPercentEnCours = 0;
  statusPercentResolues = 0;

  // Temps moyen de résolution (simulé)
  tempsMoyenResolutionGlobal = 12;

  /* ========== TECHNICIENS ========== */

  technicienSearchTerm = '';
  technicienDisponibiliteFilter: 'TOUS' | 'DISPONIBLE' | 'OCCUPE' = 'TOUS';
  technicienCategorieFilter: 'TOUTES' | string = 'TOUTES';

  technicienCategories: string[] = [
    'Support bureautique',
    'Réseau & systèmes',
    'Audiovisuel'
  ];

  techniciens: Technicien[] = [
    {
      id: 1,
      nom: 'Ousmane Mané',
      categorie: 'Support bureautique',
      disponible: true,
      specialites: ['PC', 'Imprimantes'],
      nbInterventionsEnCours: 2,
      nbInterventionsTerminees: 18,
      tempsMoyenResolutionHeures: 10,
      interventionsEnCours: [
        {
          titre: 'PC secrétariat',
          resultat: 'En cours',
          date: new Date('2025-02-20'),
          lieu: 'Secrétariat UFR',
          statut: 'EN_COURS'
        }
      ],
      dernieresInterventions: [
        {
          titre: 'Remplacement disque dur',
          resultat: 'Succès',
          date: new Date('2025-02-10'),
          lieu: 'Salle info 1',
          statut: 'RESOLUE'
        },
        {
          titre: 'Nettoyage imprimante',
          resultat: 'Succès',
          date: new Date('2025-02-15'),
          lieu: 'Scolarité',
          statut: 'RESOLUE'
        }
      ]
    },
    {
      id: 2,
      nom: 'Awa Diallo',
      categorie: 'Réseau & systèmes',
      disponible: false,
      specialites: ['Wi-Fi', 'Serveurs'],
      nbInterventionsEnCours: 1,
      nbInterventionsTerminees: 25,
      tempsMoyenResolutionHeures: 8,
      interventionsEnCours: [
        {
          titre: 'Instabilité Wi-Fi',
          resultat: 'En cours',
          date: new Date('2025-02-21'),
          lieu: 'Bibliothèque',
          statut: 'EN_COURS'
        }
      ],
      dernieresInterventions: [
        {
          titre: 'Migration serveur fichiers',
          resultat: 'Succès',
          date: new Date('2025-02-05'),
          lieu: 'Datacenter',
          statut: 'RESOLUE'
        }
      ]
    }
  ];

  filteredTechniciens: Technicien[] = [];

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
      prochaineMaintenance: new Date('2025-04-10')
    },
    {
      reference: 'IMP-010',
      type: 'Imprimante',
      localisation: 'Scolarité',
      quantite: 3,
      etat: 'EN_PANNE',
      derniereMaintenance: new Date('2024-12-20'),
      prochaineMaintenance: new Date('2025-03-01')
    },
    {
      reference: 'VP-003',
      type: 'Vidéo-projecteur',
      localisation: 'Amphi A',
      quantite: 2,
      etat: 'HORS_SERVICE',
      derniereMaintenance: null,
      prochaineMaintenance: null
    }
  ];

  filteredEquipements: Equipement[] = [];

  // Modale / formulaire d’équipement
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
    'Onduleur'
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
    quantite: 0
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

  /* ========== STOCK PIÈCES (si besoin plus tard) ========== */

  piecesDetachees: PieceDetachee[] = [
    {
      nom: 'Lampe VP standard',
      reference: 'LAMPE-VP-STD',
      stockActuel: 2,
      stockMinimum: 3,
      localisationStock: 'Magasin central'
    },
    {
      nom: 'Tambour imprimante laser',
      reference: 'TAMB-IMP-LSR',
      stockActuel: 5,
      stockMinimum: 2,
      localisationStock: 'Magasin scolarité'
    }
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
      description: 'Nettoyage interne et contrôle disque.'
    },
    {
      id: 2,
      equipementReference: 'IMP-010',
      typeEquipement: 'Imprimante',
      frequence: 'Tous les 3 mois',
      prochaineDate: new Date('2025-03-01'),
      responsable: 'Awa Diallo',
      statut: 'EN_RETARD',
      description: 'Nettoyage rouleaux et tambour.'
    },
    {
      id: 3,
      equipementReference: 'VP-003',
      typeEquipement: 'Vidéo-projecteur',
      frequence: 'Tous les 12 mois',
      prochaineDate: new Date('2025-08-15'),
      responsable: 'Ousmane Mané',
      statut: 'REALISEE',
      description: 'Changement de lampe et nettoyage optique.'
    }
  ];

  filteredMaintenancesPreventives: MaintenancePreventive[] = [];

  // options pour la liste déroulante "Équipement" du formulaire préventif
  equipementOptions: string[] = [];

  // Modale "Nouvelle maintenance"
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
    description: ''
  };

  // === RAPPORTS & STATS ===
  rapportDateDebut: string | null = null;
  rapportDateFin: string | null = null;

  // pour limiter les dates au jour courant
  today: string = new Date().toISOString().substring(0, 10);

  // contrôle du bouton export
  canExportRapport: boolean = false;

  /* ========== MODALES DÉTAILS DEMANDE / TECHNICIEN / PREVENTIVE ========== */

  showDetailsModal = false;
  selectedDemande: Demande | null = null;

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

  /* ========== CONSTRUCTEUR / INIT ========== */

  constructor(private authService: AuthService, private router: Router) {}

  goToProfile(): void {
    this.userMenuOpen = false;
    this.router.navigate(['/profil']);
  }

  ngOnInit(): void {
    this.usernameInitial = this.username.charAt(0).toUpperCase();
    this.recalculateDemandesStats();
    this.applyDemandesFilters();
    this.filterTechniciens();
    this.filterEquipements();
    this.refreshEquipementOptions();
    this.filterPreventives();
    this.recalculateStatusPercentages();
  }

  /* ========== GESTION LAYOUT / USER ========== */

  setActive(item: typeof this.activeItem): void {
    this.activeItem = item;
  }

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
    this.authService.logout(); // ✅ redirection + nettoyage du token
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
      list = list.filter(d => d.statut === this.statusFilter);
    }

    if (this.urgenceFilter !== 'TOUTES') {
      list = list.filter(d => d.urgence === this.urgenceFilter);
    }

    if (this.searchTerm.trim().length > 0) {
      list = list.filter(d =>
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
    this.enAttente = this.demandes.filter(d => d.statut === 'EN_ATTENTE').length;
    this.enCours = this.demandes.filter(d => d.statut === 'EN_COURS').length;
    this.resolues = this.demandes.filter(d => d.statut === 'RESOLUE').length;
  }

  recalculateStatusPercentages(): void {
    const total = this.totalDemandes || 1;
    this.statusPercentEnAttente = Math.round((this.enAttente / total) * 100);
    this.statusPercentEnCours = Math.round((this.enCours / total) * 100);
    this.statusPercentResolues = Math.round((this.resolues / total) * 100);
  }

  getStatusCount(statut: 'EN_ATTENTE' | 'EN_COURS' | 'RESOLUE'): number {
    return this.demandes.filter(d => d.statut === statut).length;
  }

  getUrgenceLabel(u: Demande['urgence']): string {
    if (!u || u === 'NON_DEFINIE') return 'Non définie';
    if (u === 'BASSE') return 'Basse';
    if (u === 'MOYENNE') return 'Moyenne';
    if (u === 'HAUTE') return 'Haute';
    return 'Non définie';
  }

  getStatutLabel(s: Demande['statut']): string {
    if (s === 'EN_ATTENTE') return 'En attente';
    if (s === 'EN_COURS') return 'En cours';
    return 'Résolue';
  }

  /* ========== DÉTAILS DEMANDE (MODALE) ========== */

  openDemandeDetails(d: Demande): void {
    this.selectedDemande = { ...d };
    this.modalUrgence = (d.urgence ?? '') as any;
    this.modalTechnicienId = null;
    this.modalCommentaire = '';
    this.showImageInDetails = false;
    this.markAsResolved = d.statut === 'RESOLUE';
    this.showDetailsModal = true;
  }

  closeDetailsModal(): void {
    this.showDetailsModal = false;
    this.selectedDemande = null;
  }

  saveDetails(): void {
    if (!this.selectedDemande) return;

    const index = this.demandes.findIndex(d => d.id === this.selectedDemande!.id);
    if (index !== -1) {
      const updated = { ...this.selectedDemande };
      updated.urgence = this.modalUrgence || 'NON_DEFINIE';
      if (this.markAsResolved) {
        updated.statut = 'RESOLUE';
      }
      this.demandes[index] = updated;
    }

    this.recalculateDemandesStats();
    this.recalculateStatusPercentages();
    this.applyDemandesFilters();
    this.closeDetailsModal();
  }

  exportSelectedAsPdf(): void {
    if (!this.selectedDemande) return;
    console.log('Export PDF pour la demande', this.selectedDemande.id);
  }

  /* ========== TECHNICIENS ========== */

  onTechnicienSearchChange(term: string): void {
    this.technicienSearchTerm = term.toLowerCase();
    this.filterTechniciens();
  }

  onTechnicienFiltersChanged(): void {
    this.filterTechniciens();
  }

  private filterTechniciens(): void {
    let list = [...this.techniciens];

    if (this.technicienDisponibiliteFilter === 'DISPONIBLE') {
      list = list.filter(t => t.disponible);
    } else if (this.technicienDisponibiliteFilter === 'OCCUPE') {
      list = list.filter(t => !t.disponible);
    }

    if (this.technicienCategorieFilter !== 'TOUTES') {
      list = list.filter(t => t.categorie === this.technicienCategorieFilter);
    }

    if (this.technicienSearchTerm.trim().length > 0) {
      list = list.filter(t =>
        t.nom.toLowerCase().includes(this.technicienSearchTerm) ||
        t.categorie.toLowerCase().includes(this.technicienSearchTerm)
      );
    }

    this.filteredTechniciens = list;
  }

  openTechnicienDetails(t: Technicien): void {
    this.selectedTechnicien = t;
    this.showTechnicienModal = true;
  }

  closeTechnicienModal(): void {
    this.showTechnicienModal = false;
    this.selectedTechnicien = null;
  }

  /* ========== GESTION STOCK : FILTRES & CRUD ÉQUIPEMENTS ========== */

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
      list = list.filter(e => e.etat === this.equipementEtatFilter);
    }

    if (this.equipementTypeFilter !== 'TOUS') {
      list = list.filter(e => e.type === this.equipementTypeFilter);
    }

    if (this.equipementLocalisationFilter !== 'TOUS') {
      list = list.filter(e => e.localisation === this.equipementLocalisationFilter);
    }

    if (this.equipementSearchTerm.trim().length > 0) {
      list = list.filter(e =>
        e.reference.toLowerCase().includes(this.equipementSearchTerm) ||
        e.type.toLowerCase().includes(this.equipementSearchTerm) ||
        e.localisation.toLowerCase().includes(this.equipementSearchTerm)
      );
    }

    this.filteredEquipements = list;
  }

  private refreshEquipementOptions(): void {
    this.equipementOptions = this.equipements.map(e => e.reference);
  }

  getEtatLabel(etat: Equipement['etat']): string {
    if (etat === 'EN_SERVICE') return 'En service';
    if (etat === 'EN_PANNE') return 'En panne';
    return 'Hors service';
  }

  openEquipementForm(): void {
    this.isEditingEquipement = false;
    this.equipementTypeSelection = '';
    this.equipementForm = {
      reference: '',
      type: '',
      localisation: '',
      quantite: 0
    };
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
      quantite: e.quantite
    };

    this.showEquipementModal = true;
  }

  closeEquipementForm(): void {
    this.showEquipementModal = false;
  }

  saveEquipement(): void {
    if (!this.isEquipementFormValid) return;

    if (this.isEditingEquipement) {
      const index = this.equipements.findIndex(eq => eq.reference === this.equipementForm.reference);
      if (index !== -1) {
        this.equipements[index] = {
          ...this.equipements[index],
          type: this.equipementForm.type,
          localisation: this.equipementForm.localisation,
          quantite: this.equipementForm.quantite ?? 0
        };
      }
    } else {
      const exists = this.equipements.some(eq => eq.reference === this.equipementForm.reference);
      if (exists) {
        alert("Un équipement avec cette référence existe déjà.");
        return;
      }
      this.equipements.push({
        reference: this.equipementForm.reference,
        type: this.equipementForm.type,
        localisation: this.equipementForm.localisation,
        quantite: this.equipementForm.quantite ?? 0,
        etat: 'EN_SERVICE'
      });
    }

    this.filterEquipements();
    this.refreshEquipementOptions();
    this.closeEquipementForm();
  }

  deleteEquipement(e: Equipement): void {
    const ok = confirm(`Supprimer l'équipement ${e.reference} ?`);
    if (!ok) return;
    this.equipements = this.equipements.filter(eq => eq.reference !== e.reference);
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
      list = list.filter(m => m.statut === this.preventiveStatutFilter);
    }

    if (this.preventiveSearchTerm.trim().length > 0) {
      list = list.filter(m =>
        (m.equipementReference ?? '').toLowerCase().includes(this.preventiveSearchTerm) ||
        (m.description ?? '').toLowerCase().includes(this.preventiveSearchTerm)
      );
    }

    this.filteredMaintenancesPreventives = list;
  }

  get nbPreventivesPlanifiees(): number {
    return this.maintenancesPreventives.filter(m => m.statut === 'PLANIFIEE').length;
  }

  get nbPreventivesEnRetard(): number {
    return this.maintenancesPreventives.filter(m => m.statut === 'EN_RETARD').length;
  }

  get nbPreventivesRealisees(): number {
    return this.maintenancesPreventives.filter(m => m.statut === 'REALISEE').length;
  }

  /* ----- Modale "Nouvelle maintenance" ----- */

  openPreventiveForm(): void {
    this.newPreventive = {
      equipementReference: null,
      typeEquipement: null,
      frequence: null,
      prochaineDate: '',
      responsable: this.username,
      statut: 'PLANIFIEE',
      description: ''
    };

    this.showPreventiveForm = true;
  }

  closePreventiveForm(): void {
    this.showPreventiveForm = false;
    this.resetPreventiveForm();
  }

  get isNewPreventiveValid(): boolean {
    const p = this.newPreventive;
    return !!(
      p.equipementReference &&
      p.typeEquipement &&
      p.frequence &&
      p.prochaineDate &&
      p.description &&
      p.responsable
    );
  }

  savePreventive(): void {
    if (!this.isNewPreventiveValid) return;

    const nextId =
      this.maintenancesPreventives.length === 0
        ? 1
        : Math.max(...this.maintenancesPreventives.map(m => m.id)) + 1;

    const nouvelle: MaintenancePreventive = {
      id: nextId,
      equipementReference: this.newPreventive.equipementReference,
      typeEquipement: this.newPreventive.typeEquipement,
      frequence: this.newPreventive.frequence,
      prochaineDate: new Date(this.newPreventive.prochaineDate),
      responsable: this.newPreventive.responsable,
      statut: this.newPreventive.statut as StatutPreventive,
      description: this.newPreventive.description
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
      description: ''
    };
  }

  saveNewPreventive(): void {
    this.savePreventive();
  }

  /* ========== DÉTAILS MAINTENANCE PRÉVENTIVE ========== */

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
    doc.text(
      `Période : du ${this.rapportDateDebut} au ${this.rapportDateFin}`,
      14,
      30
    );

    doc.setLineWidth(0.4);
    doc.line(14, 34, 196, 34);

    let y = 44;
    doc.text(`Total des demandes : ${this.totalDemandes}`, 14, y); y += 7;
    doc.text(`En attente : ${this.enAttente}`, 14, y); y += 7;
    doc.text(`En cours : ${this.enCours}`, 14, y); y += 7;
    doc.text(`Résolues : ${this.resolues}`, 14, y); y += 10;

    doc.setFontSize(10);
    doc.text(
      'Ce rapport est généré automatiquement à partir du tableau de bord Responsable.',
      14,
      y
    );

    const fileName = `rapport-maintenance_${this.rapportDateDebut}_au_${this.rapportDateFin}.pdf`;
    doc.save(fileName);
  }

}
