// src/app/pages/dashboard/dashboardTechnicien/dashboard-technicien.component.ts
import {
  Component,
  OnInit,
  ViewChild,
  ElementRef
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

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
  statut: 'A_FAIRE' | 'EN_COURS' | 'TERMINEE';
  lieu: string;
  urgence: 'BASSE' | 'MOYENNE' | 'HAUTE';
  noteTechnicien?: string;
  pieces?: InterventionPiece[];
  imageUrl?: string;       // image insérée par le technicien (obligatoire en EN_COURS/TERMINEE dans ton flow)
  equipementId?: number;   // lien vers équipement
}

@Component({
  selector: 'app-dashboard-technicien',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './dashboard-technicien.component.html',
  styleUrls: ['./dashboard-technicien.component.scss'],
})
export class DashboardTechnicienComponent implements OnInit {
  @ViewChild('fileInput') fileInputRef?: ElementRef<HTMLInputElement>;

  // Nom de l’utilisateur connecté
  username = 'Technicien';
  usernameInitial = 'T';

  // ===== HELP / FAQ =====
  faqOpen: boolean[] = [true, false, false];


  // Menu utilisateur
  userMenuOpen = false;
  // ===== HISTORIQUE (TERMINEE) =====
  historiqueSearch = '';
  historiqueUrgence: 'TOUTES' | 'BASSE' | 'MOYENNE' | 'HAUTE' = 'TOUTES';

  historiqueFrom = ''; // format input date: yyyy-MM-dd
  historiqueTo = '';

  historiqueItemsPerPage = 5;
  historiquePage = 1;
  historiqueTotalPages = 1;
  paginatedHistorique: Intervention[] = [];


  // Onglet actif de la sidebar
  activeItem:
    | 'dashboard'
    | 'interventions'
    | 'equipements'
    | 'historique'
    | 'help'
    | 'profile' = 'dashboard';


  // Filtres interventions
  statutFilter: 'TOUS' | 'A_FAIRE' | 'EN_COURS' | 'TERMINEE' = 'TOUS';
  urgenceFilter: 'TOUTES' | 'BASSE' | 'MOYENNE' | 'HAUTE' = 'TOUTES';
  searchTerm = '';

  // Pagination
  paginatedInterventions: Intervention[] = [];
  itemsPerPage = 5;
  currentPage = 1;
  totalPages = 1;

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

  // Modales interventions
  decisionModalOpen = false;  // modale 1 : accepter / refuser (A_FAIRE)
  editionModalOpen = false;   // modale 2 : image + note + pièces (EN_COURS/TERMINEE)
  refuseModalOpen = false;    // modale alerte refus
  selectedIntervention: Intervention | null = null;

  // Champs édition
  updateNote = '';
  imagePreview: string | null = null;
  piecesSelection: { pieceId: number | null; quantite: number | null }[] = [];

  // Toast
  toastVisible = false;
  toastMessage = '';
  toastType: 'success' | 'danger' | 'info' = 'info';

  // Équipements (vue technicien)
  equipSearch = '';
  equipementsView: Array<Equipement & { interventionsCount: number; lastStatut?: Intervention['statut'] }> = [];
  equipementModalOpen = false;
  selectedEquipement: Equipement | null = null;
  equipInterventions: Intervention[] = [];

  constructor(private router: Router) {}

  ngOnInit(): void {
    const storedUsername = localStorage.getItem('auth_username');
    if (storedUsername) {
      this.username = storedUsername;
      this.usernameInitial = storedUsername.charAt(0).toUpperCase();
    }

    const storedProfile = localStorage.getItem('tech_profile_v2');
    if (storedProfile) {
      try {
        this.profile = JSON.parse(storedProfile);
        this.profileDraft = { ...this.profile };
      } catch {}
    } else {
      // pré-remplissage minimum
      this.profileDraft.firstName = this.username || '';
      this.profileDraft.email = '';
    }



    this.computeStats();
    this.applyFilters();
    this.buildEquipementsView();
    this.applyHistoriqueFilters();

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

// ===== PASSWORD (UI only) =====
  passwordForm = {
    current: '',
    new: '',
    confirm: '',
  };
  passwordMsg = '';


  /* ======================= SIDEBAR ======================= */

  setActive(
    item:
      | 'dashboard'
      | 'interventions'
      | 'equipements'
      | 'historique'
      | 'help'
  ) {
    this.activeItem = item;
    this.closeUserMenu();

    // Petit confort UX : quand on entre dans équipements, on construit la vue
    if (item === 'equipements') {
      this.buildEquipementsView();
    }
    if (item === 'historique') {
      this.applyHistoriqueFilters();
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

  logout(): void {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_username');
    localStorage.removeItem('auth_role');
    this.router.navigate(['/login']);
  }

  /* ======================= STATS ========================= */

  private computeStats(): void {
    this.aFaire = this.interventions.filter((i) => i.statut === 'A_FAIRE').length;
    this.enCours = this.interventions.filter((i) => i.statut === 'EN_COURS').length;
    this.terminees = this.interventions.filter((i) => i.statut === 'TERMINEE').length;
  }

  /* =================== FILTRES + RECHERCHE (INTERV) ====== */

  setStatutFilter(filter: 'TOUS' | 'A_FAIRE' | 'EN_COURS' | 'TERMINEE') {
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
          : (i.titre.toLowerCase() + ' ' + i.lieu.toLowerCase()).includes(term);

      return matchStatut && matchUrgence && matchSearch;
    });

    this.totalPages = Math.max(1, Math.ceil(filtered.length / this.itemsPerPage));
    this.paginatedInterventions = filtered.slice(
      (this.currentPage - 1) * this.itemsPerPage,
      this.currentPage * this.itemsPerPage
    );
  }

  /* ======================= PAGINATION ==================== */

  goToPage(page: number) {
    if (page < 1 || page > this.totalPages) return;
    this.currentPage = page;
    this.applyFilters();
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
      this.passwordForm.new.trim().length >= 6 &&
      this.passwordForm.new === this.passwordForm.confirm
    );
  }

  changePassword(): void {
    // UI only (pas backend)
    this.passwordMsg = 'Mot de passe mis à jour (simulation).';
    setTimeout(() => (this.passwordMsg = ''), 3000);

    this.passwordForm = { current: '', new: '', confirm: '' };
  }


  /* ======================= MODALES (INTERV) ============== */

  openDetails(intervention: Intervention) {
    this.selectedIntervention = intervention;

    if (intervention.statut === 'A_FAIRE') {
      this.decisionModalOpen = true;
      this.editionModalOpen = false;
      this.refuseModalOpen = false;
    } else {
      this.prepareEditionModal(intervention);
    }
  }

  private prepareEditionModal(intervention: Intervention) {
    this.selectedIntervention = intervention;
    this.updateNote = intervention.noteTechnicien || '';
    this.imagePreview = intervention.imageUrl || null;

    if (intervention.pieces && intervention.pieces.length > 0) {
      this.piecesSelection = intervention.pieces.map((p) => ({
        pieceId: p.pieceId,
        quantite: p.quantite,
      }));
    } else {
      this.piecesSelection = [{ pieceId: null, quantite: null }];
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

    this.selectedIntervention = null;
    this.imagePreview = null;
    this.piecesSelection = [];

    this.selectedEquipement = null;
    this.equipInterventions = [];

    if (this.fileInputRef?.nativeElement) {
      this.fileInputRef.nativeElement.value = '';
    }
  }

  /* ====== MODALE 1 : ACCEPTER / REFUSER ================== */

  accepterIntervention() {
    if (!this.selectedIntervention) return;

    this.selectedIntervention.statut = 'EN_COURS';
    this.computeStats();
    this.applyFilters();

    this.showToast('Intervention acceptée et passée en cours de traitement.', 'success');
    this.prepareEditionModal(this.selectedIntervention);
  }

  refuserIntervention() {
    if (!this.selectedIntervention) return;

    // On ferme la modale décision et on ouvre la modale d'alerte
    this.decisionModalOpen = false;
    this.refuseModalOpen = true;
  }

  cancelRefuse() {
    this.refuseModalOpen = false;
  }

  confirmRefuse() {
    if (!this.selectedIntervention) return;
    const titre = this.selectedIntervention.titre;

    // Future : appel backend pour notifier le refus
    this.closeModals();
    this.showToast(`Intervention refusée : « ${titre} ».`, 'danger');
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
    this.piecesSelection.push({ pieceId: null, quantite: null });
  }

  removePieceRow(index: number) {
    this.piecesSelection.splice(index, 1);
    if (this.piecesSelection.length === 0) {
      this.piecesSelection.push({ pieceId: null, quantite: null });
    }
  }

  onQuantityChange(sel: { pieceId: number | null; quantite: number | null }) {
    if (!sel.pieceId) {
      sel.quantite = null;
      return;
    }
    if (sel.quantite != null && sel.quantite < 1) {
      sel.quantite = 1;
    }
  }

  private buildPiecesFromSelection(): InterventionPiece[] {
    return this.piecesSelection
      .filter((sel) => sel.pieceId && sel.quantite && sel.quantite > 0)
      .map((sel) => {
        const piece = this.piecesStock.find((p) => p.id === sel.pieceId)!;
        return {
          pieceId: piece.id,
          nom: piece.nom,
          quantite: sel.quantite as number,
        };
      });
  }

  terminerIntervention() {
    if (!this.selectedIntervention || !this.imagePreview || !this.updateNote.trim()) return;

    this.selectedIntervention.statut = 'TERMINEE';
    this.selectedIntervention.noteTechnicien = this.updateNote;
    this.selectedIntervention.imageUrl = this.imagePreview;
    this.selectedIntervention.pieces = this.buildPiecesFromSelection();

    this.computeStats();
    this.applyFilters();
    this.closeModals();
    this.showToast('Intervention terminée avec succès.', 'success');
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
            : (i.titre.toLowerCase() + ' ' + i.lieu.toLowerCase()).includes(term);

        const matchFrom = fromDate ? i.dateCreation >= fromDate : true;
        const matchTo = toDate ? i.dateCreation <= toDate : true;

        return matchUrgence && matchSearch && matchFrom && matchTo;
      })
      .sort((a, b) => b.dateCreation.getTime() - a.dateCreation.getTime());

    this.historiqueTotalPages = Math.max(
      1,
      Math.ceil(filtered.length / this.historiqueItemsPerPage)
    );

    this.paginatedHistorique = filtered.slice(
      (this.historiquePage - 1) * this.historiqueItemsPerPage,
      this.historiquePage * this.historiqueItemsPerPage
    );
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

  toggleFaq(index: number) {
    this.faqOpen[index] = !this.faqOpen[index];
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
    // On garde uniquement les équipements liés aux interventions du technicien
    const ids = new Set<number>();
    this.interventions.forEach((i) => {
      if (i.equipementId) ids.add(i.equipementId);
    });

    const linkedEquipements = this.equipements.filter((e) => ids.has(e.id));

    const view = linkedEquipements.map((e) => {
      const related = this.interventions
        .filter((i) => i.equipementId === e.id)
        .sort((a, b) => b.dateCreation.getTime() - a.dateCreation.getTime());

      return {
        ...e,
        interventionsCount: related.length,
        lastStatut: related[0]?.statut,
      };
    });

    const term = this.equipSearch.trim().toLowerCase();
    this.equipementsView = term.length === 0
      ? view
      : view.filter((e) =>
        (e.nom + ' ' + e.type + ' ' + e.code + ' ' + e.lieu)
          .toLowerCase()
          .includes(term)
      );
  }

  onEquipSearchChange() {
    this.buildEquipementsView();
  }

  openEquipementDetails(e: Equipement) {
    this.selectedEquipement = e;
    this.equipInterventions = this.interventions
      .filter((i) => i.equipementId === e.id)
      .sort((a, b) => b.dateCreation.getTime() - a.dateCreation.getTime());

    this.equipementModalOpen = true;
  }

  closeUserMenu(): void {
    this.userMenuOpen = false;
  }

}
