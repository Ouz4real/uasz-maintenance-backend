// src/app/pages/dashboard/dashboardSuperviseur/dashboard-superviseur.component.ts

import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { SuperviseurApiService, SuperviseurDashboardDto } from '../../../core/services/superviseur-api.service';
import { EquipementStatsDto } from '../../../core/models/equipement-stats.model';
import { PannesApiService } from '../../../core/services/pannes-api.service';
import { EquipementsApiService } from '../../../core/services/equipements-api.service';
import { PanneApi, PanneRequest } from '../../../core/models/panne.model';
import { EquipementApi } from '../../../core/models/equipement.model';
import { AuthService } from '../../../core/services/auth';
import { environment } from '../../../../environments/environment';
import { NotificationBellComponent } from '../../../shared/components/notification-bell/notification-bell.component';
import { Subscription, interval, fromEvent } from 'rxjs';
import { switchMap, filter } from 'rxjs/operators';
import * as jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import * as XLSX from 'xlsx';

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

@Component({
  selector: 'app-dashboard-superviseur',
  standalone: true,
  imports: [CommonModule, FormsModule, NotificationBellComponent],
  templateUrl: './dashboard-superviseur.component.html',
  styleUrls: ['./dashboard-superviseur.component.scss'],
})
export class DashboardSuperviseurComponent implements OnInit, OnDestroy {
  // Nom de l'utilisateur connecté
  username = 'Superviseur';
  usernameInitial = 'S';

  private mesDemandessPollingSubscription?: Subscription;

  // Menu utilisateur
  userMenuOpen = false;
  showLogoutModal = false;

  // Onglet actif de la sidebar
  activeItem:
    | 'dashboard'
    | 'signalements'
    | 'interventions'
    | 'equipements'
    | 'mes-demandes'
    | 'stats'
    | 'profil'
    | 'help' = 'dashboard';

  // Données du dashboard
  dashboardData: SuperviseurDashboardDto | null = null;
  isLoading = false;
  errorMessage: string | null = null;

  // Type de graphique sélectionné
  chartTypePannes: 'vertical' | 'pie' = 'vertical';
  chartTypePriorites: 'vertical' | 'pie' = 'vertical';
  chartTypeInterventions: 'vertical' | 'pie' = 'vertical';

  // Filtres de période pour Signalements
  dateDebut: string = '';
  dateFin: string = '';
  dashboardDataFiltered: SuperviseurDashboardDto | null = null;

  // Filtres de période pour Interventions
  dateDebutInterventions: string = '';
  dateFinInterventions: string = '';
  dashboardDataFilteredInterventions: SuperviseurDashboardDto | null = null;

  // Filtres de période pour Équipements
  dateDebutEquipements: string = '';
  dateFinEquipements: string = '';
  equipementStatsFiltered: EquipementStatsDto | null = null;

  // Filtres de période pour les exports
  dateDebutExport: string = '';
  dateFinExport: string = '';
  errorMessageExport: string = '';
  isExportDatesValid: boolean = true;

  // FAQ
  activeFaqIndex: number | null = null;

  // Modal documentation
  showDocumentationModal: boolean = false;

  // Date maximale (aujourd'hui)
  maxDate: string = '';

  // Messages de notification
  notificationMessage: string = '';
  notificationType: 'success' | 'error' | 'warning' = 'error';
  showNotification: boolean = false;

  // Validation des dates
  datesValidSignalements: boolean = true;
  datesValidInterventions: boolean = true;
  datesValidEquipements: boolean = true;

  // Données des équipements
  equipementStats: EquipementStatsDto | null = null;
  isLoadingEquipements = false;
  errorMessageEquipements: string | null = null;
  chartTypeEquipementsType: 'vertical' | 'pie' = 'pie';
  chartTypeEquipementsLocalisation: 'vertical' | 'pie' = 'vertical';

  // Pagination pour équipements problématiques
  currentPageEquipements = 1;
  itemsPerPageEquipements = 5;

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

  // Formulaire profil
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

  // Visibilité des mots de passe
  showCurrentPassword = false;
  showNewPassword = false;
  showConfirmPassword = false;

  constructor(
    private router: Router,
    private superviseurApi: SuperviseurApiService,
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

    // Afficher le nom complet si disponible
    if (storedPrenom && storedNom) {
      this.username = `${storedPrenom} ${storedNom}`;
      this.usernameInitial = storedPrenom.charAt(0).toUpperCase();
    }

    // Définir la date maximale (aujourd'hui)
    const today = new Date();
    this.maxDate = today.toISOString().split('T')[0];

    // Charger les données du dashboard
    this.loadDashboardData();
    
    // Charger les demandes
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
    document.body.classList.remove('modal-open');
  }

  /**
   * Charge les données du dashboard depuis le backend
   */
  loadDashboardData(): void {
    this.isLoading = true;
    this.errorMessage = null;

    this.superviseurApi.getMonDashboard().subscribe({
      next: (data: SuperviseurDashboardDto) => {
        this.dashboardData = data;
        this.isLoading = false;
        console.log('📊 Dashboard Superviseur chargé:', data);
      },
      error: (err) => {
        console.error('❌ Erreur chargement dashboard:', err);
        this.errorMessage = 'Impossible de charger les données du dashboard.';
        this.isLoading = false;
      }
    });
  }

  // Méthodes pour gérer le scroll du body
  private lockBodyScroll(): void {
    document.body.classList.add('modal-open');
  }

  private unlockBodyScroll(): void {
    document.body.classList.remove('modal-open');
  }

  // Ouvrir / fermer le menu utilisateur
  toggleUserMenu(): void {
    this.userMenuOpen = !this.userMenuOpen;
  }

  // Fermer le menu utilisateur
  closeUserMenu(): void {
    this.userMenuOpen = false;
  }

  // Ouvrir le profil
  openProfile(): void {
    this.setActive('profil');
    this.userMenuOpen = false;
    this.loadProfilData();
  }

  // Charger les données du profil
  loadProfilData(): void {
    const storedNom = localStorage.getItem('auth_nom') || '';
    const storedPrenom = localStorage.getItem('auth_prenom') || '';
    const storedEmail = localStorage.getItem('auth_email') || '';
    const storedUsername = localStorage.getItem('auth_username') || '';
    
    this.profilForm.nom = storedNom;
    this.profilForm.prenom = storedPrenom;
    this.profilForm.email = storedEmail || `${storedUsername}@uasz.sn`;
    this.profilForm.telephone = localStorage.getItem('auth_telephone') || '';
    this.profilForm.service = localStorage.getItem('auth_service') || 'Service de Supervision';
    this.profilForm.departement = localStorage.getItem('auth_departement') || 'Département Maintenance';
  }

  // Réinitialiser le formulaire profil
  resetProfilForm(): void {
    this.loadProfilData();
    this.profilForm.motDePasseActuel = '';
    this.profilForm.nouveauMotDePasse = '';
    this.profilForm.confirmationMotDePasse = '';
  }

  // Enregistrer les modifications du profil (informations personnelles)
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
    this.username = `${this.profilForm.prenom} ${this.profilForm.nom}`;
    this.usernameInitial = this.profilForm.prenom.charAt(0).toUpperCase();

    this.showToast('Profil mis à jour avec succès', 'success');
  }

  // Mettre à jour le mot de passe
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

    console.log('🔐 Tentative de changement de mot de passe');
    console.log('📝 Mot de passe actuel saisi:', this.profilForm.motDePasseActuel);
    console.log('📝 Nouveau mot de passe:', this.profilForm.nouveauMotDePasse);

    // Appeler l'API pour changer le mot de passe
    this.authService.changePassword(
      this.profilForm.motDePasseActuel,
      this.profilForm.nouveauMotDePasse
    ).subscribe({
      next: (response) => {
        console.log('✅ Réponse du serveur:', response);
        this.showToast('Mot de passe mis à jour avec succès', 'success');
        
        // Réinitialiser les champs de mot de passe
        this.profilForm.motDePasseActuel = '';
        this.profilForm.nouveauMotDePasse = '';
        this.profilForm.confirmationMotDePasse = '';
      },
      error: (error) => {
        console.error('❌ Erreur complète:', error);
        console.error('❌ Status:', error.status);
        console.error('❌ Message:', error.error);
        
        // Afficher le message d'erreur du backend
        let errorMessage = 'Erreur lors du changement de mot de passe';
        if (error.error && typeof error.error === 'string') {
          errorMessage = error.error;
        } else if (error.status === 401) {
          errorMessage = 'Le mot de passe actuel est incorrect';
        }
        
        this.showToast(errorMessage, 'error');
      }
    });
  }

  // Changer l'onglet actif dans la sidebar
  setActive(
    item:
      | 'dashboard'
      | 'signalements'
      | 'interventions'
      | 'equipements'
      | 'mes-demandes'
      | 'stats'
      | 'profil'
      | 'help'
  ): void {
    this.activeItem = item;
    this.userMenuOpen = false;
    
    // Charger les stats équipements si on accède à cet onglet
    if (item === 'equipements') {
      this.loadEquipementStats();
    }
  }

  // Bouton "Tableau de bord" dans le menu utilisateur
  goToDashboard(): void {
    this.activeItem = 'dashboard';
    this.userMenuOpen = false;
  }

  // Ouvrir la modale de déconnexion
  openLogoutModal(): void {
    this.showLogoutModal = true;
    this.userMenuOpen = false;
    this.lockBodyScroll();
  }

  // Fermer la modale de déconnexion
  closeLogoutModal(): void {
    this.showLogoutModal = false;
    this.unlockBodyScroll();
  }

  // Déconnexion confirmée
  confirmLogout(): void {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_username');
    localStorage.removeItem('auth_role');
    localStorage.removeItem('auth_nom');
    localStorage.removeItem('auth_prenom');
    this.closeLogoutModal();
    this.router.navigate(['/login']);
  }

  /**
   * Calcule le taux de résolution des pannes
   */
  get tauxResolution(): number {
    if (!this.dashboardData || this.dashboardData.totalPannes === 0) {
      return 0;
    }
    return Math.round((this.dashboardData.pannesResolues / this.dashboardData.totalPannes) * 100);
  }

  /**
   * Formate le temps en heures et minutes
   */
  formatTemps(minutes: number | null): string {
    if (minutes === null || minutes === 0) {
      return 'N/A';
    }
    
    const heures = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    
    if (heures > 0) {
      return `${heures}h ${mins}min`;
    }
    return `${mins}min`;
  }

  /**
   * Change le type de graphique pour les pannes
   */
  setChartTypePannes(type: 'vertical' | 'pie'): void {
    this.chartTypePannes = type;
  }

  /**
   * Change le type de graphique pour les priorités
   */
  setChartTypePriorites(type: 'vertical' | 'pie'): void {
    this.chartTypePriorites = type;
  }

  /**
   * Change le type de graphique pour les interventions
   */
  setChartTypeInterventions(type: 'vertical' | 'pie'): void {
    this.chartTypeInterventions = type;
  }

  /**
   * Change le type de graphique pour les équipements par type
   */
  setChartTypeEquipementsType(type: 'vertical' | 'pie'): void {
    this.chartTypeEquipementsType = type;
  }

  /**
   * Change le type de graphique pour les équipements par localisation
   */
  setChartTypeEquipementsLocalisation(type: 'vertical' | 'pie'): void {
    this.chartTypeEquipementsLocalisation = type;
  }

  /**
   * Charge les statistiques des équipements
   */
  loadEquipementStats(): void {
    if (this.equipementStats) {
      return; // Déjà chargé
    }

    this.isLoadingEquipements = true;
    this.errorMessageEquipements = null;

    this.superviseurApi.getEquipementStats().subscribe({
      next: (data: EquipementStatsDto) => {
        this.equipementStats = data;
        this.isLoadingEquipements = false;
        console.log('📦 Statistiques équipements chargées:', data);
        console.log('📊 Total équipements dans la base:', data.totalEquipements);
        console.log('📊 Équipements avec pannes:', data.nombreEquipementsAvecPannes);
        console.log('📊 Nombre d\'équipements problématiques (>0 pannes):', data.topEquipementsProblematiques.length);
        console.log('📋 Liste:', data.topEquipementsProblematiques);
      },
      error: (err) => {
        console.error('❌ Erreur chargement stats équipements:', err);
        this.errorMessageEquipements = 'Impossible de charger les statistiques des équipements.';
        this.isLoadingEquipements = false;
      }
    });
  }

  /**
   * Affiche une notification toast
   */
  private showToast(message: string, type: 'success' | 'error' | 'warning' = 'error'): void {
    this.notificationMessage = message;
    this.notificationType = type;
    this.showNotification = true;

    // Masquer automatiquement après 4 secondes
    setTimeout(() => {
      this.showNotification = false;
    }, 4000);
  }

  /**
   * Ferme la notification manuellement
   */
  closeNotification(): void {
    this.showNotification = false;
  }

  /**
   * Gère le changement de dates pour filtrer les données
   */
  onDateChange(): void {
    if (this.dateDebut && this.dateFin) {
      // Vérifier que la date de début est avant la date de fin
      if (new Date(this.dateDebut) > new Date(this.dateFin)) {
        this.showToast('La date de début doit être antérieure à la date de fin', 'warning');
        this.datesValidSignalements = false;
        return;
      }
      
      this.datesValidSignalements = true;
      // Filtrer les données selon la période
      this.filterDataByPeriod();
    } else {
      this.datesValidSignalements = true;
    }
  }

  /**
   * Réinitialise les filtres de date
   */
  resetDates(): void {
    this.dateDebut = '';
    this.dateFin = '';
    this.dashboardDataFiltered = null;
    this.datesValidSignalements = true;
  }

  /**
   * Filtre les données du dashboard selon la période sélectionnée
   */
  filterDataByPeriod(): void {
    if (!this.dateDebut || !this.dateFin) return;
    
    this.isLoading = true;
    this.errorMessage = null;
    
    this.superviseurApi.getMonDashboardByPeriode(this.dateDebut, this.dateFin).subscribe({
      next: (data: SuperviseurDashboardDto) => {
        this.dashboardDataFiltered = data;
        this.isLoading = false;
        console.log(`Donnees filtrees du ${this.dateDebut} au ${this.dateFin}:`, data);
      },
      error: (err) => {
        console.error('Erreur lors du filtrage par periode:', err);
        this.errorMessage = 'Impossible de filtrer les donnees par periode.';
        this.isLoading = false;
      }
    });
  }

  /**
   * Gère le changement de dates pour filtrer les interventions
   */
  onDateChangeInterventions(): void {
    if (this.dateDebutInterventions && this.dateFinInterventions) {
      // Vérifier que la date de début est avant la date de fin
      if (new Date(this.dateDebutInterventions) > new Date(this.dateFinInterventions)) {
        this.showToast('La date de début doit être antérieure à la date de fin', 'warning');
        this.datesValidInterventions = false;
        return;
      }
      
      this.datesValidInterventions = true;
      // Filtrer les données selon la période
      this.filterDataByPeriodInterventions();
    } else {
      this.datesValidInterventions = true;
    }
  }

  /**
   * Réinitialise les filtres de date pour les interventions
   */
  resetDatesInterventions(): void {
    this.dateDebutInterventions = '';
    this.dateFinInterventions = '';
    this.dashboardDataFilteredInterventions = null;
    this.datesValidInterventions = true;
  }

  /**
   * Filtre les données des interventions selon la période sélectionnée
   */
  filterDataByPeriodInterventions(): void {
    if (!this.dateDebutInterventions || !this.dateFinInterventions) return;
    
    this.isLoading = true;
    this.errorMessage = null;
    
    this.superviseurApi.getMonDashboardByPeriode(this.dateDebutInterventions, this.dateFinInterventions).subscribe({
      next: (data: SuperviseurDashboardDto) => {
        this.dashboardDataFilteredInterventions = data;
        this.isLoading = false;
        console.log(`Donnees interventions filtrees du ${this.dateDebutInterventions} au ${this.dateFinInterventions}:`, data);
      },
      error: (err) => {
        console.error('Erreur lors du filtrage par periode:', err);
        this.errorMessage = 'Impossible de filtrer les donnees par periode.';
        this.isLoading = false;
      }
    });
  }

  /**
   * Exporte les statistiques des signalements (section Interventions) en PDF
   */
  async exportInterventionsToPDF(): Promise<void> {
    const dataToExport = this.displayData;
    if (!dataToExport) {
      console.error('Aucune donnée à exporter');
      return;
    }

    try {
      const doc = new jsPDF.default();
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      let yPosition = 20;

      // En-tête du document
      doc.setFontSize(20);
      doc.setTextColor(37, 99, 235);
      doc.text('Rapport Interventions - UASZ Maintenance', pageWidth / 2, yPosition, { align: 'center' });
      
      yPosition += 10;
      doc.setFontSize(10);
      doc.setTextColor(107, 114, 128);
      const dateStr = new Date().toLocaleDateString('fr-FR', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
      doc.text(`Genere le ${dateStr}`, pageWidth / 2, yPosition, { align: 'center' });
      
      // Afficher la période si des dates sont sélectionnées
      if (this.dateDebutInterventions && this.dateFinInterventions) {
        yPosition += 6;
        doc.setFontSize(9);
        doc.setTextColor(220, 38, 38);
        const periodeStr = `Periode: ${new Date(this.dateDebutInterventions).toLocaleDateString('fr-FR')} - ${new Date(this.dateFinInterventions).toLocaleDateString('fr-FR')}`;
        doc.text(periodeStr, pageWidth / 2, yPosition, { align: 'center' });
      }
      
      yPosition += 15;

      // Section: Statistiques des interventions
      doc.setFontSize(14);
      doc.setTextColor(17, 24, 39);
      doc.text('Statistiques des interventions', 15, yPosition);
      yPosition += 8;

      doc.setFontSize(10);
      doc.setTextColor(75, 85, 99);
      
      const interventionsData = [
        { label: 'Planifiees', value: dataToExport.interventionsPlanifiees },
        { label: 'En cours', value: dataToExport.pannesEnCours },
        { label: 'Resolues', value: dataToExport.pannesResolues },
        { label: 'Annulees', value: dataToExport.pannesAnnulees },
        { label: 'Total', value: this.getTotalInterventionsForChart() }
      ];

      interventionsData.forEach((item, index) => {
        const xPos = 15 + (index % 2) * 90;
        const yPos = yPosition + Math.floor(index / 2) * 10;
        doc.text(`${item.label}: ${item.value}`, xPos, yPos);
      });

      yPosition += 30;

      // Capturer le graphique
      const chartElements = document.querySelectorAll('.stats-section .chart-container');
      // Le graphique des interventions est le dernier dans la liste
      const interventionsChartIndex = chartElements.length - 1;
      
      if (chartElements.length > interventionsChartIndex) {
        try {
          // Appliquer une transformation pour corriger l'inversion du SVG
          const svgElements = chartElements[interventionsChartIndex].querySelectorAll('svg');
          svgElements.forEach(svg => {
            (svg as SVGElement).style.transform = 'scaleY(-1)';
          });

          const canvas = await html2canvas(chartElements[interventionsChartIndex] as HTMLElement, {
            scale: 2,
            backgroundColor: '#ffffff',
            logging: false
          });

          // Retirer la transformation
          svgElements.forEach(svg => {
            (svg as SVGElement).style.transform = '';
          });
          
          const imgData = canvas.toDataURL('image/png');
          const imgWidth = 180;
          const imgHeight = (canvas.height * imgWidth) / canvas.width;
          
          if (yPosition + imgHeight > pageHeight - 20) {
            doc.addPage();
            yPosition = 20;
          }
          
          doc.addImage(imgData, 'PNG', 15, yPosition, imgWidth, imgHeight);
        } catch (error) {
          console.error('Erreur lors de la capture du graphique:', error);
        }
      }

      // Pied de page
      doc.setFontSize(8);
      doc.setTextColor(156, 163, 175);
      doc.text('UASZ Maintenance - Systeme de gestion de maintenance', pageWidth / 2, pageHeight - 10, { align: 'center' });

      // Sauvegarder le PDF
      let fileName = `rapport-interventions-${new Date().toISOString().split('T')[0]}`;
      if (this.dateDebutInterventions && this.dateFinInterventions) {
        fileName = `rapport-interventions-${this.dateDebutInterventions}_${this.dateFinInterventions}`;
      }
      fileName += '.pdf';
      
      doc.save(fileName);
      
      console.log('PDF genere avec succes:', fileName);
    } catch (error) {
      console.error('Erreur lors de la generation du PDF:', error);
      alert('Erreur lors de la generation du PDF. Veuillez reessayer.');
    }
  }

  /**
   * Retourne les données à afficher (filtrées ou complètes)
   * Utilisé uniquement dans la section Signalements
   */
  get displayData(): SuperviseurDashboardDto | null {
    // Si on est dans Signalements et qu'il y a des données filtrées, les utiliser
    if (this.activeItem === 'signalements' && this.dashboardDataFiltered) {
      return this.dashboardDataFiltered;
    }
    // Si on est dans Interventions et qu'il y a des données filtrées, les utiliser
    if (this.activeItem === 'interventions' && this.dashboardDataFilteredInterventions) {
      return this.dashboardDataFilteredInterventions;
    }
    // Sinon, toujours utiliser les données complètes
    return this.dashboardData;
  }

  /**
   * Retourne les données complètes (non filtrées)
   * Utilisé pour toutes les autres sections
   */
  get fullData(): SuperviseurDashboardDto | null {
    return this.dashboardData;
  }

  /**
   * Calcule la longueur d'un segment du diagramme circulaire
   * Circonférence = 2πr = 2 * π * 80 = 502.4
   */
  getPieSegment(value: number, total: number): number {
    if (total === 0) return 0;
    const circumference = 502.4; // 2 * Math.PI * 80
    return (value / total) * circumference;
  }

  /**
   * Calcule l'offset pour positionner un segment du diagramme circulaire
   */
  getPieOffset(previousValues: number): number {
    const data = this.displayData || this.dashboardData;
    if (!data || data.totalPannes === 0) return 0;
    const circumference = 502.4;
    const percentage = previousValues / data.totalPannes;
    return circumference * (1 - percentage);
  }

  /**
   * Calcule le pourcentage pour la légende
   */
  getPiePercentage(value: number, total: number): number {
    if (total === 0) return 0;
    return Math.round((value / total) * 100);
  }

  /**
   * Calcule le total pour le graphique des interventions (planifiées + pannes en cours + résolues + annulées)
   */
  getTotalInterventionsForChart(): number {
    if (!this.displayData) return 0;
    return this.displayData.interventionsPlanifiees + 
           this.displayData.pannesEnCours + 
           this.displayData.pannesResolues + 
           this.displayData.pannesAnnulees;
  }

  /**
   * Calcule la longueur d'un segment du diagramme circulaire pour les interventions
   */
  getPieSegmentInterventions(value: number): number {
    const total = this.getTotalInterventionsForChart();
    if (total === 0) return 0;
    const circumference = 502.4; // 2 * Math.PI * 80
    return (value / total) * circumference;
  }

  /**
   * Calcule l'offset pour positionner un segment du diagramme circulaire des interventions
   */
  getPieOffsetInterventions(previousValues: number): number {
    const total = this.getTotalInterventionsForChart();
    if (total === 0) return 0;
    const circumference = 502.4;
    const percentage = previousValues / total;
    return circumference * (1 - percentage);
  }

  /**
   * Calcule le pourcentage pour la légende des interventions
   */
  getPiePercentageInterventions(value: number): number {
    const total = this.getTotalInterventionsForChart();
    if (total === 0) return 0;
    return Math.round((value / total) * 100);
  }

  /**
   * Exporte les statistiques en PDF avec les graphiques visuels
   */
  async exportToPDF(): Promise<void> {
    const dataToExport = this.displayData;
    if (!dataToExport) {
      console.error('Aucune donnée à exporter');
      return;
    }

    try {
      const doc = new jsPDF.default();
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      let yPosition = 20;

      // En-tête du document
      doc.setFontSize(20);
      doc.setTextColor(37, 99, 235); // Bleu
      doc.text('Rapport Signalements - UASZ Maintenance', pageWidth / 2, yPosition, { align: 'center' });
      
      yPosition += 10;
      doc.setFontSize(10);
      doc.setTextColor(107, 114, 128); // Gris
      const dateStr = new Date().toLocaleDateString('fr-FR', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
      doc.text(`Genere le ${dateStr}`, pageWidth / 2, yPosition, { align: 'center' });
      
      // Afficher la période si des dates sont sélectionnées
      if (this.dateDebut && this.dateFin) {
        yPosition += 6;
        doc.setFontSize(9);
        doc.setTextColor(220, 38, 38); // Rouge pour mettre en évidence
        const periodeStr = `Periode: ${new Date(this.dateDebut).toLocaleDateString('fr-FR')} - ${new Date(this.dateFin).toLocaleDateString('fr-FR')}`;
        doc.text(periodeStr, pageWidth / 2, yPosition, { align: 'center' });
      }
      
      yPosition += 15;

      // Section 1: Statistiques des pannes
      doc.setFontSize(14);
      doc.setTextColor(17, 24, 39);
      doc.text('Statistiques des pannes', 15, yPosition);
      yPosition += 8;

      doc.setFontSize(10);
      doc.setTextColor(75, 85, 99);
      
      const pannesData = [
        { label: 'Total pannes', value: dataToExport.totalPannes },
        { label: 'En attente', value: dataToExport.pannesOuvertes },
        { label: 'En cours', value: dataToExport.pannesEnCours },
        { label: 'Resolues', value: dataToExport.pannesResolues },
        { label: 'Annulees', value: dataToExport.pannesAnnulees }
      ];

      pannesData.forEach((item, index) => {
        const xPos = 15 + (index % 2) * 90;
        const yPos = yPosition + Math.floor(index / 2) * 10;
        doc.text(`${item.label}: ${item.value}`, xPos, yPos);
      });

      yPosition += 30;

      // Capturer le graphique "Répartition des pannes par statut"
      const chartElements = document.querySelectorAll('.stats-section .chart-container');
      if (chartElements.length > 0) {
        try {
          // Appliquer une transformation pour corriger l'inversion du SVG
          const svgElements = chartElements[0].querySelectorAll('svg');
          svgElements.forEach(svg => {
            (svg as SVGElement).style.transform = 'scaleY(-1)';
          });
          
          // Premier graphique: Répartition des pannes par statut
          const canvas1 = await html2canvas(chartElements[0] as HTMLElement, {
            scale: 2,
            backgroundColor: '#ffffff',
            logging: false
          });

          // Retirer la transformation
          svgElements.forEach(svg => {
            (svg as SVGElement).style.transform = '';
          });
          
          const imgData1 = canvas1.toDataURL('image/png');
          const imgWidth = 180;
          const imgHeight1 = (canvas1.height * imgWidth) / canvas1.width;
          
          // Vérifier si on a assez d'espace sur la page
          if (yPosition + imgHeight1 > pageHeight - 20) {
            doc.addPage();
            yPosition = 20;
          }
          
          doc.addImage(imgData1, 'PNG', 15, yPosition, imgWidth, imgHeight1);
          yPosition += imgHeight1 + 15;

          // Nouvelle page pour le deuxième graphique
          doc.addPage();
          yPosition = 20;

          // Section 2: Répartition par priorité
          doc.setFontSize(14);
          doc.setTextColor(17, 24, 39);
          doc.text('Repartition par priorite', 15, yPosition);
          yPosition += 8;

          doc.setFontSize(10);
          doc.setTextColor(75, 85, 99);
          
          const prioritesData = [
            { label: 'Priorite Haute', value: dataToExport.pannesPrioriteHaute },
            { label: 'Priorite Moyenne', value: dataToExport.pannesPrioriteMoyenne },
            { label: 'Priorite Basse', value: dataToExport.pannesPrioriteBasse }
          ];

          prioritesData.forEach((item, index) => {
            const xPos = 15 + (index % 2) * 90;
            const yPos = yPosition + Math.floor(index / 2) * 10;
            const percentage = this.getPiePercentage(item.value, dataToExport.totalPannes);
            doc.text(`${item.label}: ${item.value} (${percentage}%)`, xPos, yPos);
          });

          yPosition += 25;

          // Deuxième graphique: Distribution des priorités
          if (chartElements.length > 1) {
            // Appliquer une transformation pour corriger l'inversion du SVG
            const svgElements2 = chartElements[1].querySelectorAll('svg');
            svgElements2.forEach(svg => {
              (svg as SVGElement).style.transform = 'scaleY(-1)';
            });

            const canvas2 = await html2canvas(chartElements[1] as HTMLElement, {
              scale: 2,
              backgroundColor: '#ffffff',
              logging: false
            });

            // Retirer la transformation
            svgElements2.forEach(svg => {
              (svg as SVGElement).style.transform = '';
            });
            
            const imgData2 = canvas2.toDataURL('image/png');
            const imgHeight2 = (canvas2.height * imgWidth) / canvas2.width;
            
            // Vérifier si on a assez d'espace sur la page
            if (yPosition + imgHeight2 > pageHeight - 20) {
              doc.addPage();
              yPosition = 20;
            }
            
            doc.addImage(imgData2, 'PNG', 15, yPosition, imgWidth, imgHeight2);
          }
        } catch (error) {
          console.error('Erreur lors de la capture des graphiques:', error);
        }
      }

      // Pied de page sur toutes les pages
      const totalPages = doc.internal.pages.length - 1;
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(156, 163, 175);
        doc.text('UASZ Maintenance - Systeme de gestion de maintenance', pageWidth / 2, pageHeight - 10, { align: 'center' });
        doc.text(`Page ${i} / ${totalPages}`, pageWidth - 20, pageHeight - 10, { align: 'right' });
      }

      // Sauvegarder le PDF avec la période dans le nom si applicable
      let fileName = `rapport-signalements-${new Date().toISOString().split('T')[0]}`;
      if (this.dateDebut && this.dateFin) {
        fileName = `rapport-signalements-${this.dateDebut}_${this.dateFin}`;
      }
      fileName += '.pdf';
      
      doc.save(fileName);
      
      console.log('PDF genere avec succes:', fileName);
    } catch (error) {
      console.error('Erreur lors de la generation du PDF:', error);
      alert('Erreur lors de la generation du PDF. Veuillez reessayer.');
    }
  }

  /**
   * Calcule le pourcentage pour les équipements
   */
  getEquipementPercentage(value: number, total: number): number {
    if (total === 0) return 0;
    return Math.round((value / total) * 100);
  }

  /**
   * Calcule la longueur d'un segment du diagramme circulaire pour équipements
   */
  getPieSegmentEquipement(value: number, total: number): number {
    if (total === 0) return 0;
    const circumference = 502.4;
    return (value / total) * circumference;
  }

  /**
   * Calcule l'offset pour positionner un segment du diagramme circulaire pour équipements
   */
  getPieOffsetEquipement(previousValues: number, total: number): number {
    if (total === 0) return 0;
    const circumference = 502.4;
    const percentage = previousValues / total;
    return circumference * (1 - percentage);
  }

  /**
   * Calcule la somme des équipements par type jusqu'à l'index i
   */
  getSumEquipementsType(index: number): number {
    if (!this.equipementStats) return 0;
    return this.equipementStats.repartitionParType
      .slice(0, index)
      .reduce((sum, item) => sum + item.nombre, 0);
  }

  /**
   * Calcule le total des pannes pour les graphiques de type
   */
  getTotalPannesType(): number {
    const stats = this.displayEquipementStats;
    if (!stats) return 0;
    return stats.repartitionParType.reduce((sum, item) => sum + item.nombre, 0);
  }

  /**
   * Calcule la somme des pannes par localisation jusqu'à l'index i
   */
  getSumPannesLocalisation(index: number): number {
    const stats = this.displayEquipementStats;
    if (!stats) return 0;
    return stats.repartitionParLocalisation
      .slice(0, index)
      .reduce((sum, item) => sum + item.nombre, 0);
  }

  /**
   * Retourne la classe CSS pour l'état de l'équipement
   */
  getEtatClass(etat: string): string {
    switch (etat) {
      case 'EN_SERVICE':
        return 'status-done';
      case 'EN_PANNE':
        return 'status-progress';
      case 'HORS_SERVICE':
        return 'status-cancelled';
      default:
        return '';
    }
  }

  /**
   * Retourne le libellé formaté pour l'état
   */
  getEtatLabel(etat: string): string {
    switch (etat) {
      case 'EN_SERVICE':
        return 'En service';
      case 'EN_PANNE':
        return 'En panne';
      case 'HORS_SERVICE':
        return 'Hors service';
      default:
        return etat;
    }
  }

  /**
   * Retourne les équipements problématiques paginés
   */
  getPaginatedEquipementsProblematiques() {
    const stats = this.displayEquipementStats;
    if (!stats) return [];
    const startIndex = (this.currentPageEquipements - 1) * this.itemsPerPageEquipements;
    const endIndex = startIndex + this.itemsPerPageEquipements;
    return stats.topEquipementsProblematiques.slice(startIndex, endIndex);
  }

  /**
   * Retourne le nombre total de pages
   */
  getTotalPagesEquipements(): number {
    const stats = this.displayEquipementStats;
    if (!stats) return 0;
    return Math.ceil(stats.topEquipementsProblematiques.length / this.itemsPerPageEquipements);
  }

  /**
   * Retourne l'index de début pour l'affichage de pagination
   */
  get equipementsPageStartIndex(): number {
    const stats = this.displayEquipementStats;
    if (!stats || stats.topEquipementsProblematiques.length === 0) return 0;
    return (this.currentPageEquipements - 1) * this.itemsPerPageEquipements + 1;
  }

  /**
   * Retourne l'index de fin pour l'affichage de pagination
   */
  get equipementsPageEndIndex(): number {
    const stats = this.displayEquipementStats;
    if (!stats) return 0;
    return Math.min(
      this.currentPageEquipements * this.itemsPerPageEquipements,
      stats.topEquipementsProblematiques.length
    );
  }

  /**
   * Retourne le nombre total d'équipements problématiques
   */
  get equipementsTotalCount(): number {
    const stats = this.displayEquipementStats;
    return stats ? stats.topEquipementsProblematiques.length : 0;
  }

  /**
   * Retourne un tableau des numéros de pages à afficher avec fenêtre glissante (max 7)
   */
  getPagesEquipements(): (number | string)[] {
    const total = this.getTotalPagesEquipements();
    const current = this.currentPageEquipements;
    const maxVisible = 7;
    const pages: (number | string)[] = [];
    
    if (total <= maxVisible) {
      for (let i = 1; i <= total; i++) {
        pages.push(i);
      }
    } else {
      pages.push(1);
      
      let startPage: number;
      let endPage: number;
      
      if (current <= 4) {
        startPage = 2;
        endPage = 6;
      } else if (current >= total - 3) {
        startPage = total - 5;
        endPage = total - 1;
      } else {
        startPage = current - 2;
        endPage = current + 2;
      }
      
      if (startPage > 2) {
        pages.push('...');
      }
      
      for (let i = startPage; i <= endPage; i++) {
        pages.push(i);
      }
      
      if (endPage < total - 1) {
        pages.push('...');
      }
      
      pages.push(total);
    }
    
    return pages;
  }

  /**
   * Change de page
   */
  goToPageEquipements(page: number): void {
    if (page >= 1 && page <= this.getTotalPagesEquipements()) {
      this.currentPageEquipements = page;
    }
  }

  /**
   * Page précédente
   */
  previousPageEquipements(): void {
    if (this.currentPageEquipements > 1) {
      this.currentPageEquipements--;
    }
  }

  /**
   * Page suivante
   */
  nextPageEquipements(): void {
    if (this.currentPageEquipements < this.getTotalPagesEquipements()) {
      this.currentPageEquipements++;
    }
  }

  /**
   * Calcule le total des pannes pour les graphiques de localisation
   */
  getTotalPannesLocalisation(): number {
    const stats = this.displayEquipementStats;
    if (!stats) return 0;
    return stats.repartitionParLocalisation.reduce((sum, item) => sum + item.nombre, 0);
  }

  /**
   * Retourne les 5 premières localisations + "Autres" pour le reste
   */
  getTop5LocalisationsWithOthers() {
    const stats = this.displayEquipementStats;
    if (!stats) return [];
    
    const localisations = stats.repartitionParLocalisation;
    if (localisations.length <= 5) {
      return localisations;
    }
    
    // Prendre les 5 premières
    const top5 = localisations.slice(0, 5);
    
    // Calculer la somme des autres
    const others = localisations.slice(5);
    const othersSum = others.reduce((sum, item) => sum + item.nombre, 0);
    
    // Ajouter "Autres" si nécessaire
    if (othersSum > 0) {
      return [
        ...top5,
        {
          localisation: 'Autres',
          nombre: othersSum,
          enService: 0,
          enPanne: othersSum,
          horsService: 0
        }
      ];
    }
    
    return top5;
  }

  /**
   * Calcule la somme des pannes pour les top 5 localisations jusqu'à l'index i
   */
  getSumTop5Localisations(index: number): number {
    const localisations = this.getTop5LocalisationsWithOthers();
    return localisations.slice(0, index).reduce((sum, item) => sum + item.nombre, 0);
  }

  /**
   * Retourne les 5 premiers types + "Autres" pour le reste
   */
  getTop5TypesWithOthers() {
    const stats = this.displayEquipementStats;
    if (!stats) return [];
    
    const types = stats.repartitionParType;
    if (types.length <= 5) {
      return types;
    }
    
    // Prendre les 5 premiers
    const top5 = types.slice(0, 5);
    
    // Calculer la somme des autres
    const others = types.slice(5);
    const othersSum = others.reduce((sum, item) => sum + item.nombre, 0);
    
    // Ajouter "Autres" si nécessaire
    if (othersSum > 0) {
      return [
        ...top5,
        {
          type: 'Autres',
          nombre: othersSum,
          enService: 0,
          enPanne: othersSum,
          horsService: 0
        }
      ];
    }
    
    return top5;
  }

  /**
   * Calcule la somme des pannes pour les top 5 types jusqu'à l'index i
   */
  getSumTop5Types(index: number): number {
    const types = this.getTop5TypesWithOthers();
    return types.slice(0, index).reduce((sum, item) => sum + item.nombre, 0);
  }

  /**
   * Gère le changement de dates pour filtrer les équipements
   */
  onDateChangeEquipements(): void {
    if (this.dateDebutEquipements && this.dateFinEquipements) {
      if (new Date(this.dateDebutEquipements) > new Date(this.dateFinEquipements)) {
        this.showToast('La date de début doit être antérieure à la date de fin', 'warning');
        this.datesValidEquipements = false;
        return;
      }
      this.datesValidEquipements = true;
      this.filterEquipementsByPeriod();
    } else {
      this.datesValidEquipements = true;
    }
  }

  /**
   * Réinitialise les filtres de date pour les équipements
   */
  resetDatesEquipements(): void {
    this.dateDebutEquipements = '';
    this.dateFinEquipements = '';
    this.equipementStatsFiltered = null;
    this.datesValidEquipements = true;
  }

  /**
   * Filtre les données des équipements selon la période sélectionnée
   */
  filterEquipementsByPeriod(): void {
    if (!this.dateDebutEquipements || !this.dateFinEquipements) return;
    
    this.isLoadingEquipements = true;
    
    this.superviseurApi.getEquipementStatsByPeriode(this.dateDebutEquipements, this.dateFinEquipements).subscribe({
      next: (data: EquipementStatsDto) => {
        this.equipementStatsFiltered = data;
        this.isLoadingEquipements = false;
        this.errorMessageEquipements = null;
        console.log(`Donnees equipements filtrees du ${this.dateDebutEquipements} au ${this.dateFinEquipements}:`, data);
      },
      error: (err) => {
        console.error('Erreur lors du filtrage par periode:', err);
        this.isLoadingEquipements = false;
        
        // Afficher un message d'erreur temporaire
        this.errorMessageEquipements = 'Impossible de filtrer les donnees. Veuillez vous reconnecter.';
        
        // Réinitialiser les dates après 3 secondes
        setTimeout(() => {
          this.errorMessageEquipements = null;
          this.dateDebutEquipements = '';
          this.dateFinEquipements = '';
        }, 3000);
      }
    });
  }

  /**
   * Retourne les données d'équipements à afficher (filtrées ou complètes)
   */
  get displayEquipementStats(): EquipementStatsDto | null {
    return this.equipementStatsFiltered || this.equipementStats;
  }

  /**
   * Exporte les statistiques des équipements en PDF
   */
  async exportEquipementsToPDF(): Promise<void> {
    const dataToExport = this.displayEquipementStats;
    if (!dataToExport) {
      console.error('Aucune donnée à exporter');
      return;
    }

    try {
      const doc = new jsPDF.default();
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      let yPosition = 20;

      // En-tête du document
      doc.setFontSize(20);
      doc.setTextColor(37, 99, 235);
      doc.text('Rapport Equipements - UASZ Maintenance', pageWidth / 2, yPosition, { align: 'center' });
      
      yPosition += 10;
      doc.setFontSize(10);
      doc.setTextColor(107, 114, 128);
      const dateStr = new Date().toLocaleDateString('fr-FR', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
      doc.text(`Genere le ${dateStr}`, pageWidth / 2, yPosition, { align: 'center' });
      
      if (this.dateDebutEquipements && this.dateFinEquipements) {
        yPosition += 6;
        doc.setFontSize(9);
        doc.setTextColor(220, 38, 38);
        const periodeStr = `Periode: ${new Date(this.dateDebutEquipements).toLocaleDateString('fr-FR')} - ${new Date(this.dateFinEquipements).toLocaleDateString('fr-FR')}`;
        doc.text(periodeStr, pageWidth / 2, yPosition, { align: 'center' });
      }
      
      yPosition += 15;

      // Capturer le graphique "Répartition par type d'équipement"
      const equipementTypeChart = document.getElementById('equipement-type-chart');
      
      if (equipementTypeChart) {
        try {
          console.log('📊 Capture du graphique par type...');
          
          const svgElements = equipementTypeChart.querySelectorAll('svg');
          svgElements.forEach((svg: SVGElement) => {
            svg.style.transform = 'scaleY(-1)';
          });

          const canvas = await html2canvas(equipementTypeChart, {
            scale: 2,
            backgroundColor: '#ffffff',
            logging: false
          });

          svgElements.forEach((svg: SVGElement) => {
            svg.style.transform = '';
          });
          
          const imgData = canvas.toDataURL('image/png');
          const imgWidth = 180;
          const imgHeight = (canvas.height * imgWidth) / canvas.width;
          
          if (yPosition + imgHeight > pageHeight - 20) {
            doc.addPage();
            yPosition = 20;
          }
          
          doc.addImage(imgData, 'PNG', 15, yPosition, imgWidth, imgHeight);
          yPosition += imgHeight + 15;
          console.log('✅ Graphique par type capturé');
        } catch (error) {
          console.error('❌ Erreur lors de la capture du graphique par type:', error);
        }
      } else {
        console.warn('⚠️ Graphique par type non trouvé');
      }

      // Nouvelle page pour le deuxième graphique
      doc.addPage();
      yPosition = 20;

      // Section: Répartition par localisation
      doc.setFontSize(14);
      doc.setTextColor(17, 24, 39);
      doc.text('Repartition par localisation', 15, yPosition);
      yPosition += 10;

      // Capturer le graphique "Répartition par localisation"
      const equipementLocalisationChart = document.getElementById('equipement-localisation-chart');
      
      if (equipementLocalisationChart) {
        try {
          console.log('📊 Capture du graphique par localisation...');
          
          const svgElements = equipementLocalisationChart.querySelectorAll('svg');
          svgElements.forEach((svg: SVGElement) => {
            svg.style.transform = 'scaleY(-1)';
          });

          const canvas = await html2canvas(equipementLocalisationChart, {
            scale: 2,
            backgroundColor: '#ffffff',
            logging: false
          });

          svgElements.forEach((svg: SVGElement) => {
            svg.style.transform = '';
          });
          
          const imgData = canvas.toDataURL('image/png');
          const imgWidth = 180;
          const imgHeight = (canvas.height * imgWidth) / canvas.width;
          
          if (yPosition + imgHeight > pageHeight - 20) {
            doc.addPage();
            yPosition = 20;
          }
          
          doc.addImage(imgData, 'PNG', 15, yPosition, imgWidth, imgHeight);
          console.log('✅ Graphique par localisation capturé');
        } catch (error) {
          console.error('❌ Erreur lors de la capture du graphique par localisation:', error);
        }
      } else {
        console.warn('⚠️ Graphique par localisation non trouvé');
      }

      // Pied de page sur toutes les pages
      const totalPages = doc.internal.pages.length - 1;
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(156, 163, 175);
        doc.text('UASZ Maintenance - Systeme de gestion de maintenance', pageWidth / 2, pageHeight - 10, { align: 'center' });
        doc.text(`Page ${i} / ${totalPages}`, pageWidth - 20, pageHeight - 10, { align: 'right' });
      }

      // Sauvegarder le PDF
      let fileName = `rapport-equipements-${new Date().toISOString().split('T')[0]}`;
      if (this.dateDebutEquipements && this.dateFinEquipements) {
        fileName = `rapport-equipements-${this.dateDebutEquipements}_${this.dateFinEquipements}`;
      }
      fileName += '.pdf';
      
      doc.save(fileName);
      
      console.log('PDF genere avec succes:', fileName);
    } catch (error) {
      console.error('Erreur lors de la generation du PDF:', error);
      alert('Erreur lors de la generation du PDF. Veuillez reessayer.');
    }
  }

  // ===== MÉTHODES POUR RAPPORTS & STATS =====

  /**
   * Réinitialise les filtres de dates pour les exports
   */
  resetDatesExport(): void {
    this.dateDebutExport = '';
    this.dateFinExport = '';
    this.errorMessageExport = '';
    this.isExportDatesValid = true;
  }

  /**
   * Gère le changement de dates pour les exports
   */
  onDateChangeExport(): void {
    this.errorMessageExport = '';
    this.isExportDatesValid = true;

    if (!this.dateDebutExport || !this.dateFinExport) {
      return;
    }

    const debut = new Date(this.dateDebutExport);
    const fin = new Date(this.dateFinExport);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Vérifier si les dates sont dans le futur
    if (debut > today) {
      this.errorMessageExport = 'La date de début ne peut pas être dans le futur';
      this.isExportDatesValid = false;
      setTimeout(() => {
        this.errorMessageExport = '';
      }, 5000);
      return;
    }

    if (fin > today) {
      this.errorMessageExport = 'La date de fin ne peut pas être dans le futur';
      this.isExportDatesValid = false;
      setTimeout(() => {
        this.errorMessageExport = '';
      }, 5000);
      return;
    }

    // Vérifier si la date de début est après la date de fin
    if (debut > fin) {
      this.errorMessageExport = 'La date de début doit être antérieure à la date de fin';
      this.isExportDatesValid = false;
      setTimeout(() => {
        this.errorMessageExport = '';
      }, 5000);
      return;
    }

    // Si tout est valide, charger les données filtrées
    this.loadFilteredDataForExport();
  }

  /**
   * Charge les données filtrées pour les exports si nécessaire
   */
  private async loadFilteredDataForExport(): Promise<void> {
    if (this.dateDebutExport && this.dateFinExport) {
      // Charger les données filtrées si elles ne sont pas déjà chargées
      if (!this.dashboardDataFiltered || !this.dashboardDataFilteredInterventions || !this.equipementStatsFiltered) {
        try {
          // Charger les données du dashboard filtrées
          this.superviseurApi.getMonDashboardByPeriode(this.dateDebutExport, this.dateFinExport)
            .subscribe({
              next: (data: SuperviseurDashboardDto) => {
                this.dashboardDataFiltered = data;
                this.dashboardDataFilteredInterventions = data;
              },
              error: (err: any) => {
                console.error('Erreur lors du chargement des données filtrées:', err);
              }
            });

          // Charger les stats équipements filtrées
          this.superviseurApi.getEquipementStatsByPeriode(this.dateDebutExport, this.dateFinExport)
            .subscribe({
              next: (stats: EquipementStatsDto) => {
                this.equipementStatsFiltered = stats;
              },
              error: (err: any) => {
                console.error('Erreur lors du chargement des stats équipements filtrées:', err);
              }
            });
        } catch (error) {
          console.error('Erreur:', error);
        }
      }
    }
  }

  /**
   * Exporte les interventions au format Excel
   */
  async exportInterventionsExcel(): Promise<void> {
    await this.loadFilteredDataForExport();
    
    const data = this.prepareInterventionsData();
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Interventions');
    
    const fileName = this.getExportFileName('interventions', 'xlsx');
    XLSX.writeFile(wb, fileName);
    
    this.showToast('Export Excel réussi!', 'success');
  }

  /**
   * Exporte les interventions au format CSV
   */
  async exportInterventionsCSV(): Promise<void> {
    await this.loadFilteredDataForExport();
    
    const data = this.prepareInterventionsData();
    const ws = XLSX.utils.json_to_sheet(data);
    const csv = XLSX.utils.sheet_to_csv(ws);
    
    const fileName = this.getExportFileName('interventions', 'csv');
    this.downloadCSV(csv, fileName);
    
    this.showToast('Export CSV réussi!', 'success');
  }

  /**
   * Exporte les signalements au format Excel
   */
  async exportSignalementsExcel(): Promise<void> {
    await this.loadFilteredDataForExport();
    
    const data = this.prepareSignalementsData();
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Signalements');
    
    const fileName = this.getExportFileName('signalements', 'xlsx');
    XLSX.writeFile(wb, fileName);
    
    this.showToast('Export Excel réussi!', 'success');
  }

  /**
   * Exporte les signalements au format CSV
   */
  async exportSignalementsCSV(): Promise<void> {
    await this.loadFilteredDataForExport();
    
    const data = this.prepareSignalementsData();
    const ws = XLSX.utils.json_to_sheet(data);
    const csv = XLSX.utils.sheet_to_csv(ws);
    
    const fileName = this.getExportFileName('signalements', 'csv');
    this.downloadCSV(csv, fileName);
    
    this.showToast('Export CSV réussi!', 'success');
  }

  /**
   * Exporte les équipements au format Excel
   */
  async exportEquipementsExcel(): Promise<void> {
    await this.loadFilteredDataForExport();
    
    const data = this.prepareEquipementsData();
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Équipements');
    
    const fileName = this.getExportFileName('equipements', 'xlsx');
    XLSX.writeFile(wb, fileName);
    
    this.showToast('Export Excel réussi!', 'success');
  }

  /**
   * Exporte les équipements au format CSV
   */
  async exportEquipementsCSV(): Promise<void> {
    await this.loadFilteredDataForExport();
    
    const data = this.prepareEquipementsData();
    const ws = XLSX.utils.json_to_sheet(data);
    const csv = XLSX.utils.sheet_to_csv(ws);
    
    const fileName = this.getExportFileName('equipements', 'csv');
    this.downloadCSV(csv, fileName);
    
    this.showToast('Export CSV réussi!', 'success');
  }

  /**
   * Prépare les données des interventions pour l'export
   */
  private prepareInterventionsData(): any[] {
    const data = this.dateDebutExport && this.dateFinExport 
      ? this.dashboardDataFilteredInterventions 
      : this.dashboardData;

    if (!data) return [];

    return [
      {
        'Type': 'Maintenances Planifiées',
        'Nombre': data.interventionsPlanifiees,
        'Période': this.getExportPeriodLabel()
      },
      {
        'Type': 'Pannes En Cours',
        'Nombre': data.pannesEnCours,
        'Période': this.getExportPeriodLabel()
      },
      {
        'Type': 'Pannes Résolues',
        'Nombre': data.pannesResolues,
        'Période': this.getExportPeriodLabel()
      },
      {
        'Type': 'Pannes Annulées',
        'Nombre': data.pannesAnnulees,
        'Période': this.getExportPeriodLabel()
      },
      {
        'Type': 'Total Interventions',
        'Nombre': data.totalInterventions,
        'Période': this.getExportPeriodLabel()
      },
      {
        'Type': 'Temps Moyen (minutes)',
        'Nombre': data.tempsMoyenRealisationMinutes || 0,
        'Période': this.getExportPeriodLabel()
      }
    ];
  }

  /**
   * Prépare les données des signalements pour l'export
   */
  private prepareSignalementsData(): any[] {
    const data = this.dateDebutExport && this.dateFinExport 
      ? this.dashboardDataFiltered 
      : this.dashboardData;

    if (!data) return [];

    return [
      {
        'Statut': 'Ouvertes',
        'Nombre': data.pannesOuvertes,
        'Période': this.getExportPeriodLabel()
      },
      {
        'Statut': 'En Cours',
        'Nombre': data.pannesEnCours,
        'Période': this.getExportPeriodLabel()
      },
      {
        'Statut': 'Résolues',
        'Nombre': data.pannesResolues,
        'Période': this.getExportPeriodLabel()
      },
      {
        'Statut': 'Annulées',
        'Nombre': data.pannesAnnulees,
        'Période': this.getExportPeriodLabel()
      },
      {
        'Priorité': 'Haute',
        'Nombre': data.pannesPrioriteHaute,
        'Période': this.getExportPeriodLabel()
      },
      {
        'Priorité': 'Moyenne',
        'Nombre': data.pannesPrioriteMoyenne,
        'Période': this.getExportPeriodLabel()
      },
      {
        'Priorité': 'Basse',
        'Nombre': data.pannesPrioriteBasse,
        'Période': this.getExportPeriodLabel()
      },
      {
        'Indicateur': 'Total Pannes',
        'Valeur': data.totalPannes,
        'Période': this.getExportPeriodLabel()
      },
      {
        'Indicateur': 'Temps Moyen Résolution (min)',
        'Valeur': data.tempsMoyenResolutionMinutes || 0,
        'Période': this.getExportPeriodLabel()
      }
    ];
  }

  /**
   * Prépare les données des équipements pour l'export
   */
  private prepareEquipementsData(): any[] {
    const stats = this.dateDebutExport && this.dateFinExport 
      ? this.equipementStatsFiltered 
      : this.equipementStats;

    if (!stats) return [];

    const data: any[] = [];

    // Ajouter les types d'équipements
    stats.repartitionParType.forEach(item => {
      data.push({
        'Catégorie': 'Type',
        'Nom': item.type,
        'Nombre de Pannes': item.nombre,
        'Période': this.getExportPeriodLabel()
      });
    });

    // Ajouter les localisations
    stats.repartitionParLocalisation.forEach(item => {
      data.push({
        'Catégorie': 'Localisation',
        'Nom': item.localisation,
        'Nombre de Pannes': item.nombre,
        'Période': this.getExportPeriodLabel()
      });
    });

    return data;
  }

  /**
   * Génère le nom de fichier pour l'export
   */
  private getExportFileName(type: string, extension: string): string {
    const today = new Date();
    const dateStr = today.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }).replace(/\//g, '-');
    
    if (this.dateDebutExport && this.dateFinExport) {
      const debut = new Date(this.dateDebutExport).toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      }).replace(/\//g, '-');
      
      const fin = new Date(this.dateFinExport).toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      }).replace(/\//g, '-');
      
      return `${type}_${debut}_au_${fin}.${extension}`;
    }
    return `${type}_${dateStr}.${extension}`;
  }

  /**
   * Retourne le label de la période pour l'export
   */
  private getExportPeriodLabel(): string {
    if (this.dateDebutExport && this.dateFinExport) {
      const debut = this.formatDateToFrench(this.dateDebutExport);
      const fin = this.formatDateToFrench(this.dateFinExport);
      return `${debut} au ${fin}`;
    }
    return 'Toutes les données';
  }

  /**
   * Formate une date au format français (ex: 4 mars 2026)
   */
  private formatDateToFrench(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  }

  /**
   * Télécharge un fichier CSV
   */
  private downloadCSV(csv: string, fileName: string): void {
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', fileName);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  // ===== MÉTHODES POUR AIDE & SUPPORT =====

  /**
   * Toggle l'affichage d'une question FAQ
   */
  toggleFaq(index: number): void {
    this.activeFaqIndex = this.activeFaqIndex === index ? null : index;
  }

  /**
   * Ouvre le modal de documentation
   */
  openDocumentation(): void {
    this.showDocumentationModal = true;
    this.lockBodyScroll();
  }

  /**
   * Ferme le modal de documentation
   */
  closeDocumentation(): void {
    this.showDocumentationModal = false;
    this.unlockBodyScroll();
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
      nbRelances: 0,
      dateDerniereRelance: undefined,
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
    if (this.selectedEquipementPreset === 'AUTRE' && !this.equipementAutre.trim()) return true;
    if (!this.newDemande.urgenceDemandeur) return true;
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

    const selected = (this.selectedEquipementPreset ?? '').trim();
    const isAutre = selected === 'AUTRE';
    const autreValue = (this.equipementAutre ?? '').trim();

    const typeEquipementFinal = isAutre
      ? `AUTRE: ${autreValue || 'Non précisé'}`
      : (selected || 'Non spécifié');

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
        if (err.status === 413) {
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

  /**
   * Gère le clic sur une notification
   */
  onNotificationClicked(notification: any): void {
    console.log('🔔 Notification cliquée (Superviseur):', notification);
    
    if (!notification || !notification.entityType) {
      console.warn('⚠️ Notification invalide');
      return;
    }

    // Rediriger selon le type d'entité
    switch (notification.entityType) {
      case 'PANNE':
        // Charger les détails de la panne et ouvrir le modal
        if (notification.entityId) {
          this.loadPanneDetailsAndOpenModal(notification.entityId);
        } else {
          console.warn('⚠️ entityId manquant dans la notification');
        }
        break;
        
      default:
        console.warn('⚠️ Type d\'entité non géré:', notification.entityType);
    }
  }

  /**
   * Charge les détails d'une panne et ouvre le modal
   */
  private loadPanneDetailsAndOpenModal(panneId: number): void {
    this.pannesApi.getPanneById(panneId).subscribe({
      next: (panne: PanneApi) => {
        // Convertir la panne en Demande pour le modal
        this.selectedDemande = this.mapPanneToDemande(panne);
        this.showDemandeDetailsModal = true;
        this.lockBodyScroll();
        console.log('✅ Détails de la panne chargés:', this.selectedDemande);
      },
      error: (err: any) => {
        console.error('❌ Erreur chargement détails panne:', err);
        this.showToast('Impossible de charger les détails de la demande', 'error');
      }
    });
  }
}
