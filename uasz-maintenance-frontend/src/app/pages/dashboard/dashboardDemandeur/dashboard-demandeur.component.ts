// src/app/pages/dashboard/dashboardDemandeur/dashboard-demandeur.component.ts

import { Component, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';

import { PannesApiService } from '../../../core/services/pannes-api.service';
import { EquipementsApiService } from '../../../core/services/equipements-api.service';

import { PanneApi, PanneRequest } from '../../../core/models/panne.model';
import { EquipementApi } from '../../../core/models/equipement.model';

type DemandeStatut = 'EN_ATTENTE' | 'EN_COURS' | 'RESOLUE';
type UrgenceNiveau = 'BASSE' | 'MOYENNE' | 'HAUTE';
type StatutFilter = 'TOUTES' | DemandeStatut;
type UrgenceFilter = 'TOUTES' | UrgenceNiveau;
type PageKey = 'dashboard' | 'mes-demandes' | 'documents' | 'aide' | 'profil';

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

  // 🔥 Urgences
  urgenceDemandeur: UrgenceNiveau;
  urgenceResponsable?: UrgenceNiveau;
  urgence: UrgenceNiveau; // Urgence à afficher (responsable si définie, sinon demandeur)

  // 🔁 Relances
  nbRelances?: number;
  dateDerniereRelance?: Date;
}

interface NouvelleDemandeForm {
  titre: string;
  lieu: string;

  typeEquipement: string;        // ✅ EXISTANT ou 'AUTRE'
  typeEquipementAutre: string;   // ✅ précision si AUTRE

  equipementId: number | null;   // ✅ null si AUTRE (et null par défaut tant que l’utilisateur ne choisit pas)
  description: string;
  imageFile: File | null;
  imagePreview: string | null;
  urgenceDemandeur: UrgenceNiveau | null;
}

interface DemandeurProfilForm {
  nom: string;
  prenom: string;
  email: string;
  telephone: string;
  service: string;
  departement: string;

  // Sécurité
  motDePasseActuel: string;
  nouveauMotDePasse: string;
  confirmationMotDePasse: string;
}

type DocumentType = 'IMAGE' | 'PDF' | 'RAPPORT' | 'AUTRE';

interface DemandeDocument {
  id: number;
  nom: string;
  type: DocumentType;
  demandeId: number;
  demandeTitre: string;
  dateDepot: Date;
  taille?: string;
  url?: string;
}

@Component({
  selector: 'app-dashboard-demandeur',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './dashboard-demandeur.component.html',
  styleUrls: ['./dashboard-demandeur.component.scss'],
})
export class DashboardDemandeurComponent implements OnInit {
  username = 'Demandeur';
  usernameInitial = 'D';

  userMenuOpen = false;

  activeItem: PageKey = 'dashboard';

  demandes: Demande[] = [];

  readonly MAX_IMAGE_SIZE = 2 * 1024 * 1024; // 2 Mo
  readonly ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/jpg'];
  imageErrorMessage: string | null = null;

  // ✅ liste venant du backend (pour le select)
  equipementsDisponibles: { id: number; libelle: string }[] = [];

  /* ----- DOCUMENTS ----- */
  documents: DemandeDocument[] = [];
  docTypeFilter: DocumentType | 'TOUS' = 'TOUS';
  docSearchTerm = '';

  // ✅ Liste réelle venant du backend
  equipementsApi: EquipementApi[] = [];
  equipementsLoading = false;
  equipementsError: string | null = null;

  /* ----- PROFIL DEMANDEUR ----- */
  profilForm: DemandeurProfilForm = {
    nom: '',
    prenom: '',
    email: '',
    telephone: '',
    service: '',
    departement: '',
    motDePasseActuel: '',
    nouveauMotDePasse: '',
    confirmationMotDePasse: '',
  };

  private profilInitial!: DemandeurProfilForm;

  enAttente = 0;
  enCours = 0;
  resolues = 0;

  /* ----- FILTRES (Mes demandes) ----- */
  statutFilter: StatutFilter = 'TOUTES';
  urgenceFilter: UrgenceFilter = 'TOUTES';
  searchTerm = '';

  /* ----- PAGINATION ----- */
  pageSize = 5;
  currentPage = 1;

  /* ----- PAGINATION DASHBOARD ----- */
  dashboardPageSize = 5;
  dashboardCurrentPage = 1;

  get pagedDashboardDemandes(): Demande[] {
    const startIndex = (this.dashboardCurrentPage - 1) * this.dashboardPageSize;
    return this.demandes.slice(startIndex, startIndex + this.dashboardPageSize);
  }

  get dashboardTotalPages(): number {
    return Math.max(1, Math.ceil(this.demandes.length / this.dashboardPageSize));
  }

  get dashboardTotalPagesArray(): number[] {
    return Array.from({ length: this.dashboardTotalPages }, (_, i) => i + 1);
  }

  get dashboardPageStartIndex(): number {
    const total = this.demandes.length;
    return total === 0 ? 0 : (this.dashboardCurrentPage - 1) * this.dashboardPageSize + 1;
  }

  get dashboardPageEndIndex(): number {
    const start = (this.dashboardCurrentPage - 1) * this.dashboardPageSize;
    return Math.min(start + this.dashboardPageSize, this.demandes.length);
  }

  goToDashboardPage(page: number): void {
    if (page < 1 || page > this.dashboardTotalPages) return;
    this.dashboardCurrentPage = page;
  }

  /* ----- MODAL NOUVELLE DEMANDE ----- */
  showNewDemandeModal = false;

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

  /* ----- MODAL DÉTAILS ----- */
  showDetailsModal = false;
  selectedDemande: Demande | null = null;
  showImageInDetails = false;

  /* ----- LIGHTBOX IMAGE ----- */
  isImageLightboxOpen = false;
  lightboxImageSrc: string | null = null;

  /* ----- TOAST DE SUCCÈS ----- */
  showSuccessToast = false;
  successMessage = '';

  constructor(
    private router: Router,
    private pannesApi: PannesApiService,
    private equipementsApiService: EquipementsApiService
  ) {}

  ngOnInit(): void {
    const storedUsername = localStorage.getItem('auth_username');
    if (storedUsername) {
      this.username = storedUsername;
      this.usernameInitial = storedUsername.charAt(0).toUpperCase();
    }

    // ✅ 1) charger les pannes du demandeur connecté
    this.loadMesDemandes();

    // ✅ 2) charger la liste des équipements de la BD
    this.loadEquipements();

    this.computeStats();
  }

  /* ----- DOCUMENTS : construit depuis les demandes ----- */
  private syncDocumentsFromDemandes(): void {
    const docs: DemandeDocument[] = (this.demandes ?? [])
      .filter(d => !!d.imageUrl)
      .map((d, idx) => {
        const url = d.imageUrl as string;

        const nom = d.titre
          ? `Image - ${d.titre}`
          : `Image demande #${d.id}`;

        const dateDepot = new Date((d.dateCreation as any) ?? Date.now());

        return {
          id: Number(`${d.id}${idx}`),
          nom,
          type: 'IMAGE',
          demandeId: d.id,
          demandeTitre: d.titre || `Demande #${d.id}`,
          dateDepot,
          url,
        };
      });

    docs.sort((a, b) => b.dateDepot.getTime() - a.dateDepot.getTime());
    this.documents = docs;
  }

  /* ---- FILTRAGE (liste complète filtrée, sans pagination) ---- */
  get filteredDemandes(): Demande[] {
    const term = this.searchTerm.trim().toLowerCase();

    return this.demandes.filter((d) => {
      if (this.statutFilter !== 'TOUTES' && d.statut !== this.statutFilter) {
        return false;
      }

      if (this.urgenceFilter !== 'TOUTES' && d.urgenceDemandeur !== this.urgenceFilter) {
        return false;
      }

      if (!term) return true;

      const inTitre = d.titre.toLowerCase().includes(term);
      const inLieu = d.lieu.toLowerCase().includes(term);
      const inType = d.typeEquipement.toLowerCase().includes(term);
      const inStatut = this.getStatutLabel(d.statut).toLowerCase().includes(term);

      return inTitre || inLieu || inType || inStatut;
    });
  }

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

  isAutreEquipement(): boolean {
    return this.selectedEquipementPreset === 'AUTRE';
  }

  private buildTypeEquipement(): string {
    if (this.selectedEquipementPreset === 'AUTRE') {
      return `AUTRE: ${this.equipementAutre?.trim() || 'Non précisé'}`;
    }
    return this.selectedEquipementPreset?.trim() || 'Non spécifié';
  }

  /* ----- DOCUMENTS : filtrage ----- */
  get filteredDocuments(): DemandeDocument[] {
    const term = this.docSearchTerm.trim().toLowerCase();

    return this.documents.filter((doc) => {
      if (this.docTypeFilter !== 'TOUS' && doc.type !== this.docTypeFilter) {
        return false;
      }
      if (!term) return true;

      const inNom = doc.nom.toLowerCase().includes(term);
      const inDemande = doc.demandeTitre.toLowerCase().includes(term);

      return inNom || inDemande;
    });
  }

  /* ----- PAGINATION DOCUMENTS ----- */
  docPageSize = 5;
  docCurrentPage = 1;

  get pagedDocuments(): DemandeDocument[] {
    const startIndex = (this.docCurrentPage - 1) * this.docPageSize;
    return this.filteredDocuments.slice(startIndex, startIndex + this.docPageSize);
  }

  get docTotalPages(): number {
    return Math.max(1, Math.ceil(this.filteredDocuments.length / this.docPageSize));
  }

  get docTotalPagesArray(): number[] {
    return Array.from({ length: this.docTotalPages }, (_, i) => i + 1);
  }

  get docPageStartIndex(): number {
    const total = this.filteredDocuments.length;
    return total === 0 ? 0 : (this.docCurrentPage - 1) * this.docPageSize + 1;
  }

  get docPageEndIndex(): number {
    const start = (this.docCurrentPage - 1) * this.docPageSize;
    return Math.min(start + this.docPageSize, this.filteredDocuments.length);
  }

  goToDocPage(page: number): void {
    if (page < 1 || page > this.docTotalPages) return;
    this.docCurrentPage = page;
  }

  setDocTypeFilter(filter: DocumentType | 'TOUS'): void {
    this.docTypeFilter = filter;
    this.docCurrentPage = 1;
  }

  onDocSearchChange(value: string): void {
    this.docSearchTerm = value;
    this.docCurrentPage = 1;
  }

  ouvrirDocument(doc: DemandeDocument): void {
    if (!doc.url) return;
    window.open(doc.url, '_blank');
  }

  allerVersDemande(doc: DemandeDocument): void {
    const demande = this.demandes.find((d) => d.id === doc.demandeId);
    if (demande) {
      this.openDemandeDetails(demande);
    }
  }

  /* ---- LISTE PAGINÉE POUR L'AFFICHAGE ---- */
  get pagedDemandes(): Demande[] {
    const startIndex = (this.currentPage - 1) * this.pageSize;
    return this.filteredDemandes.slice(startIndex, startIndex + this.pageSize);
  }

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.filteredDemandes.length / this.pageSize));
  }

  get totalPagesArray(): number[] {
    return Array.from({ length: this.totalPages }, (_, i) => i + 1);
  }

  get pageStartIndex(): number {
    const total = this.filteredDemandes.length;
    return total === 0 ? 0 : (this.currentPage - 1) * this.pageSize + 1;
  }

  get pageEndIndex(): number {
    const start = (this.currentPage - 1) * this.pageSize;
    return Math.min(start + this.pageSize, this.filteredDemandes.length);
  }

  computeStats(): void {
    this.enAttente = this.demandes.filter((d) => d.statut === 'EN_ATTENTE').length;
    this.enCours = this.demandes.filter((d) => d.statut === 'EN_COURS').length;
    this.resolues = this.demandes.filter((d) => d.statut === 'RESOLUE').length;
  }

  setActive(item: PageKey): void {
    this.activeItem = item;
  }

  toggleUserMenu(): void {
    this.userMenuOpen = !this.userMenuOpen;
  }

  closeUserMenu(): void {
    this.userMenuOpen = false;
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

  openProfile(): void {
    this.activeItem = 'profil';
    this.closeUserMenu();
  }

  resetProfilForm(): void {
    this.profilForm = { ...this.profilInitial };
  }

  enregistrerProfil(): void {
    this.profilInitial = { ...this.profilForm };

    this.successMessage =
      'Vos informations de profil ont été enregistrées (synchronisation avec le serveur à venir).';
    this.showSuccessToast = true;

    setTimeout(() => {
      this.showSuccessToast = false;
    }, 4000);
  }

  /* ----- FILTRES ----- */
  setStatutFilter(filter: StatutFilter): void {
    this.statutFilter = filter;
    this.currentPage = 1;
  }

  setUrgenceFilter(filter: UrgenceFilter): void {
    this.urgenceFilter = filter;
    this.currentPage = 1;
  }

  onSearchChange(value: string): void {
    this.searchTerm = value;
    this.currentPage = 1;
  }

  /* ----- PAGINATION ----- */
  goToPage(page: number): void {
    if (page < 1 || page > this.totalPages) return;
    this.currentPage = page;
  }

  goToNextPage(): void {
    this.goToPage(this.currentPage + 1);
  }

  goToPreviousPage(): void {
    this.goToPage(this.currentPage - 1);
  }

  /* ----- MODAL NOUVELLE DEMANDE ----- */
  openNewDemandeModal(): void {
    this.resetNewDemandeForm();
    this.showNewDemandeModal = true;

    // ✅ IMPORTANT : on NE pré-sélectionne PLUS equipementId automatiquement
    // Sinon ça force toujours l’équipement #1 (et donc Amphi 1 / Vidéoprojecteur...)
  }

  closeNewDemandeModal(): void {
    this.resetNewDemandeForm();
    this.showNewDemandeModal = false;
  }

  /* --- GESTION IMAGE --- */
  onFileSelected(e: Event): void {
    const input = e.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    const file = input.files[0];

    if (!this.ALLOWED_IMAGE_TYPES.includes(file.type)) {
      this.imageErrorMessage =
        'Format d’image non autorisé. Veuillez choisir une image JPG ou PNG.';
      this.removeSelectedImage();
      return;
    }

    if (file.size > this.MAX_IMAGE_SIZE) {
      this.imageErrorMessage =
        'Image trop volumineuse. La taille maximale autorisée est de 2 Mo.';
      this.removeSelectedImage();
      return;
    }

    this.imageErrorMessage = null;
    this.newDemande.imageFile = file;

    const reader = new FileReader();
    reader.onload = () => {
      this.newDemande.imagePreview = reader.result as string;
    };
    reader.readAsDataURL(file);
  }

  removeSelectedImage(): void {
    this.newDemande.imageFile = null;
    this.newDemande.imagePreview = null;

    const fileInput = document.getElementById('image') as HTMLInputElement | null;
    if (fileInput) {
      fileInput.value = '';
    }
  }

  /* ----- VALIDATION FORMULAIRE ----- */
  public isNewDemandeValid(): boolean {
    const titreOk = !!this.newDemande.titre?.trim();
    const lieuOk = !!this.newDemande.lieu?.trim();
    const urgenceOk = !!this.newDemande.urgenceDemandeur;

    const equipementOk =
      !!this.selectedEquipementPreset &&
      (this.selectedEquipementPreset !== 'AUTRE' || !!this.equipementAutre?.trim());

    const imageOk = !!this.newDemande.imageFile;

    return titreOk && lieuOk && urgenceOk && equipementOk && imageOk;
  }

  /* ----- SOUMISSION NOUVELLE DEMANDE (API) ----- */
  submitNewDemande(): void {
    if (!this.newDemande.imageFile) {
      this.imageErrorMessage =
        'Veuillez obligatoirement joindre une image de l’équipement.';
      return;
    }

    if (!this.isNewDemandeValid()) return;

    const selected = (this.selectedEquipementPreset ?? '').trim();
    const isAutre = selected === 'AUTRE' || this.newDemande.typeEquipement === 'AUTRE';

    const autreValue = (this.equipementAutre ?? this.newDemande.typeEquipementAutre ?? '').trim();

    const typeEquipementFinal = isAutre
      ? `AUTRE: ${autreValue || 'Non précisé'}`
      : (selected || (this.newDemande.typeEquipement ?? '').trim() || 'Non spécifié');

    let descriptionFinale = this.newDemande.description;

    if (isAutre) {
      descriptionFinale =
        `[Équipement non référencé] ${autreValue || 'Non précisé'}\n\n` +
        this.newDemande.description;
    }

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

    // ✅ IMPORTANT : on envoie equipementId UNIQUEMENT si l’utilisateur l’a choisi explicitement
    // (et seulement si tu utilises réellement ce mode)
    if (!isAutre && this.newDemande.equipementId != null && !this.selectedEquipementPreset) {
      fd.append('equipementId', String(this.newDemande.equipementId));
    }


    if (this.newDemande.imageFile) {
      fd.append('image', this.newDemande.imageFile);
    }

    console.log('POST /api/pannes (multipart)');
    console.log('📦 FormData envoyé :', Array.from(fd.entries()));

    this.pannesApi.createPanne(fd).subscribe({
      next: (createdApi) => {
        const createdDemande: Demande = this.mapPanneToDemande(createdApi);

        this.demandes.unshift(createdDemande);
        this.demandes = this.sortDemandesForUi(this.demandes);
        this.syncDocumentsFromDemandes();

        this.computeStats();
        this.currentPage = 1;

        this.closeNewDemandeModal();

        this.successMessage = 'Votre demande a été créée avec succès !';
        this.showSuccessToast = true;
        setTimeout(() => (this.showSuccessToast = false), 4000);
      },
      error: (err) => {
        if (err.status === 413) {
          this.imageErrorMessage =
            'L’image sélectionnée est trop volumineuse. Veuillez choisir une image de moins de 2 Mo.';
        } else {
          console.error('Erreur création panne', err);
        }
      },
    });
  }

  private resetNewDemandeForm(): void {
    this.newDemande = {
      titre: '',
      lieu: '',
      typeEquipement: '',
      typeEquipementAutre: '',
      equipementId: null, // ✅ reste null (pas de pré-sélection)
      description: '',
      imageFile: null,
      imagePreview: null,
      urgenceDemandeur: null,
    };

    this.selectedEquipementPreset = '';
    this.equipementAutre = '';
    this.imageErrorMessage = null;
  }

  /* ----- DETAILS ----- */
  openDemandeDetails(d: Demande): void {
    this.selectedDemande = d;
    this.showDetailsModal = true;
    this.showImageInDetails = false;
  }

  closeDetailsModal(): void {
    this.showDetailsModal = false;
    this.selectedDemande = null;
  }

  getStatutLabel(s: DemandeStatut): string {
    return s === 'EN_ATTENTE' ? 'En attente' : s === 'EN_COURS' ? 'En cours' : 'Résolue';
  }

  getUrgenceLabel(u?: UrgenceNiveau | null): string {
    if (!u) return 'Non définie';
    return u === 'BASSE' ? 'Urgence basse' : u === 'MOYENNE' ? 'Urgence moyenne' : 'Urgence haute';
  }

  getUrgenceChipClass(u?: UrgenceNiveau | null): string {
    if (!u) return '';
    return u === 'BASSE' ? 'urgence-basse' : u === 'MOYENNE' ? 'urgence-moyenne' : 'urgence-haute';
  }

  peutRelancer(d: Demande): boolean {
    if (d.statut !== 'EN_ATTENTE') return false;

    const referenceDate = d.dateDerniereRelance ?? d.dateCreation;
    const now = new Date();
    const diffMs = now.getTime() - referenceDate.getTime();
    const diffJours = diffMs / (1000 * 60 * 60 * 24);

    return diffJours >= 5;
  }

  relancerSelectedDemande(): void {
    if (!this.selectedDemande) return;
    if (!this.peutRelancer(this.selectedDemande)) return;
    this.relancerDemande(this.selectedDemande);
  }

  onRelancerClick(d: Demande, event: MouseEvent): void {
    event.stopPropagation();
    this.relancerDemande(d);
  }

  relancerDemande(d: Demande): void {
    const maintenant = new Date();

    d.nbRelances = (d.nbRelances ?? 0) + 1;
    d.dateDerniereRelance = maintenant;

    this.successMessage =
      'Votre demande a bien été relancée. Le service maintenance sera à nouveau notifié.';
    this.showSuccessToast = true;

    setTimeout(() => {
      this.showSuccessToast = false;
    }, 4000);
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

  /* =========================
     API LOADERS
     ========================= */
  private loadMesDemandes(): void {
    this.pannesApi.getMesPannes().subscribe({
      next: (pannes: PanneApi[]) => {
        const mappedDemandes = pannes.map((p: PanneApi) => this.mapPanneToDemande(p));

        this.demandes = this.sortDemandesForUi(mappedDemandes);
        this.syncDocumentsFromDemandes();

        this.computeStats();
        this.currentPage = 1;
      },
      error: (err: unknown) => {
        console.error('❌ Erreur chargement /api/pannes/mes-pannes:', err);
      },
    });
  }

  private loadEquipements(): void {
    this.equipementsLoading = true;
    this.equipementsError = null;

    this.equipementsApiService.getAll().subscribe({
      next: (items: EquipementApi[]) => {
        this.equipementsApi = items ?? [];
        this.equipementsLoading = false;

        // ✅ IMPORTANT : on NE touche PAS à newDemande.equipementId ici
        // (pas de pré-sélection automatique)
      },
      error: (err: unknown) => {
        console.error('❌ Erreur chargement /api/equipements:', err);
        this.equipementsLoading = false;
        this.equipementsError = "Impossible de charger la liste des équipements.";
      },
    });
  }

  private mapPanneToDemande(p: PanneApi): Demande {
    const statutUi: DemandeStatut =
      p.statut === 'OUVERTE' ? 'EN_ATTENTE' : p.statut === 'EN_COURS' ? 'EN_COURS' : 'RESOLUE';

    const urgenceUi: UrgenceNiveau =
      p.priorite === 'HAUTE' ? 'HAUTE' : p.priorite === 'MOYENNE' ? 'MOYENNE' : 'BASSE';

    const baseUrl = 'http://localhost:8080';
    const imageUrl = p.imagePath ? `${baseUrl}${p.imagePath}` : undefined;

    return {
      id: p.id,
      titre: p.titre,
      dateCreation: new Date(p.dateSignalement),
      statut: statutUi,

      // ✅ Si l'équipement existe -> libelle/localisation
      // ✅ Sinon -> champ saisi (p.lieu / p.typeEquipement)
      lieu: (p.equipement?.localisation ?? p.lieu ?? 'Non spécifié') as string,
      typeEquipement: (p.equipement?.libelle ?? p.typeEquipement ?? 'Équipement') as string,

      description: p.description ?? '',
      imageUrl,

      urgenceDemandeur: urgenceUi,
      urgenceResponsable: undefined,
      urgence: urgenceUi, // Urgence à afficher (pour l'instant = urgenceDemandeur)

      nbRelances: 0,
      dateDerniereRelance: undefined,
    };
  }

  private generateCode(): string {
    const rand = Math.floor(100 + Math.random() * 900);
    return `PAN-${rand}`;
  }

  private sortDemandesForUi(list: Demande[]): Demande[] {
    const rank = (s: DemandeStatut): number => {
      switch (s) {
        case 'EN_ATTENTE': return 0;
        case 'EN_COURS': return 1;
        case 'RESOLUE': return 2;
        default: return 99;
      }
    };

    const time = (d?: Date): number => {
      if (!d) return 0;
      const t = new Date(d).getTime();
      return Number.isFinite(t) ? t : 0;
    };

    return [...(list ?? [])].sort((a, b) => {
      const rs = rank(a.statut) - rank(b.statut);
      if (rs !== 0) return rs;
      return time(b.dateCreation) - time(a.dateCreation);
    });
  }

  onTypeEquipementChange(value: string): void {
    if (value === 'AUTRE') {
      this.newDemande.equipementId = null;
      this.newDemande.typeEquipementAutre = '';
      return;
    }

    const id = Number(value);
    this.newDemande.equipementId = Number.isFinite(id) ? id : null;
    this.newDemande.typeEquipementAutre = '';
  }
}
