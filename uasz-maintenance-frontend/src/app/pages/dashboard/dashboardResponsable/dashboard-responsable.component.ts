import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import jsPDF from 'jspdf';
import { AuthService } from '../../../core/services/auth';
import { HttpErrorResponse } from '@angular/common/http';
import { forkJoin, Subscription } from 'rxjs';
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
import {PanneApi} from '../../../core/models/panne.model';
import { Demande } from '../../../core/models/demande.model';
import { DemandeService } from '../../../core/services/demande.service';
import {Panne} from '../../../core/services/panne';
import { PannesService } from '../../../core/services/pannes.service';
import { NotificationBellComponent } from '../../../shared/components/notification-bell/notification-bell.component';
import { DemandesPollingService } from '../../../core/services/demandes-polling.service';








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

type PrioriteResp = 'BASSE' | 'MOYENNE' | 'HAUTE';



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


interface Intervention {
  titre: string;
  resultat: string;
  date: Date;
  lieu: string;
  statut: 'EN_ATTENTE' | 'EN_COURS' | 'RESOLUE';
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
  imports: [CommonModule, FormsModule, DatePipe, NotificationBellComponent],
})
export class DashboardResponsableComponent implements OnInit, OnDestroy {
  
  // Exposer Math pour l'utiliser dans le template
  Math = Math;
  
  // 🔄 Subscription pour le polling automatique
  private pollingSubscription?: Subscription;
  private mesDemandesSubscription?: Subscription;

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


  // verrouille l'affectation + urgence après sauvegarde
  assignmentLocked = false;

// (optionnel) pour éviter double clic
  savingAffectation = false;

  allowEditAssignment = false;     // ✏️ mode édition activé via bouton "Modifier"

  savingAssignment = false;





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

  // 🔥 Toast notifications
  showToast = false;
  toastMessage = '';
  toastType: 'success' | 'error' | 'info' = 'success';

  showLogoutModal = false;
  showPreventiveForm = false;
  showAnnulerMaintenanceConfirm = false;

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
  modalUrgenceResponsable: PrioriteResp | null = null;

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

  get isAffectationValid(): boolean {
    const urgence = this.selectedDemande?.urgenceResponsable;
    const urgenceOk = !!urgence && urgence !== 'NON_DEFINIE';
    const technicienOk = this.modalTechnicienId !== null;

    return urgenceOk && technicienOk;
  }

  onMarkAsResolvedChange(): void {
    if (this.selectedDemande?.statut !== 'EN_COURS') {
      this.markAsResolved = false;
    }
  }

  saveAffectationEtUrgence(): void {
    if (!this.selectedDemande) return;

    // 🔥 Vérifier que la demande n'est pas déjà résolue ou annulée
    if (this.selectedDemande.statut === 'RESOLUE' || this.selectedDemande.statut === 'ANNULEE') {
      console.warn('Impossible de modifier une demande résolue ou annulée');
      return;
    }

    const isResolving = this.markAsResolved === true;

    // 🔴 CAS : RÉSOLUTION
    if (isResolving) {
      this.demandeService
        .traiterParResponsable(
          this.selectedDemande.id,
          this.modalTechnicienId!,
          this.modalUrgenceResponsable!,
          'RESOLUE',
          this.modalCommentaire || undefined
        )
        .subscribe({
          next: (updated) => this.onSucces(updated),
          error: err => console.error(err)
        });

      return;
    }

    // 🔵 CAS : AFFECTATION / MODIFICATION
    if (!this.modalTechnicienId || !this.modalUrgenceResponsable) {
      console.warn('Technicien ou urgence manquant');
      return;
    }

    this.demandeService
      .traiterParResponsable(
        this.selectedDemande.id,
        this.modalTechnicienId,
        this.modalUrgenceResponsable,
        undefined,
        this.modalCommentaire || undefined
      )
      .subscribe({
        next: (updated) => this.onSucces(updated),
        error: err => console.error(err)
      });
  }

  marquerCommeResolue(): void {
    if (!this.selectedDemande || !this.markAsResolved) return;

    // Vérifier que l'intervention est terminée
    if (this.selectedDemande.statutInterventions !== 'TERMINEE') {
      console.warn('L\'intervention doit être terminée avant de marquer la panne comme résolue');
      return;
    }

    // Appeler le service pour marquer comme résolue
    this.pannesService.marquerPanneResolue(this.selectedDemande.id, true).subscribe({
      next: () => {
        // Mettre à jour localement
        if (this.selectedDemande) {
          this.selectedDemande.statut = 'RESOLUE';
        }

        // Mettre à jour dans le tableau
        const index = this.demandes.findIndex(d => d.id === this.selectedDemande!.id);
        if (index !== -1) {
          this.demandes[index].statut = 'RESOLUE';
        }

        // Réinitialiser la checkbox
        this.markAsResolved = false;

        // Fermer la modale
        this.showDetailsModal = false;

        // Afficher un toast de succès
        this.showSuccessToast('Demande marquée comme résolue avec succès !');

        // Recharger les données
        this.chargerDemandesDepuisApi();
        this.chargerTechniciensDepuisApi();
        this.refreshDemandesUi();
      },
      error: (err) => {
        console.error('Erreur lors du marquage comme résolue:', err);
        this.showErrorToast('Erreur lors du marquage comme résolue');
      }
    });
  }

  exporterInterventionPDF(): void {
    if (!this.selectedDemande) return;

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    let yPos = 20;

    // En-tête
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('RAPPORT D\'INTERVENTION', pageWidth / 2, yPos, { align: 'center' });
    yPos += 15;

    // Informations générales
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Informations générales', 15, yPos);
    yPos += 8;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Titre: ${this.selectedDemande.titre}`, 15, yPos);
    yPos += 6;
    doc.text(`Date de création: ${new Date(this.selectedDemande.dateCreation).toLocaleDateString('fr-FR')}`, 15, yPos);
    yPos += 6;
    doc.text(`Lieu: ${this.selectedDemande.lieu}`, 15, yPos);
    yPos += 6;
    doc.text(`Type d'équipement: ${this.selectedDemande.typeEquipement}`, 15, yPos);
    yPos += 6;
    doc.text(`Signalée par: ${this.selectedDemande.demandeurNom}`, 15, yPos);
    yPos += 10;

    // Statuts et urgences
    doc.setFont('helvetica', 'bold');
    doc.text('Statuts et priorités', 15, yPos);
    yPos += 8;

    doc.setFont('helvetica', 'normal');
    doc.text(`Statut de la panne: ${this.selectedDemande.statut}`, 15, yPos);
    yPos += 6;
    doc.text(`Statut de l'intervention: ${this.selectedDemande.statutInterventions}`, 15, yPos);
    yPos += 6;
    
    // Urgence du demandeur avec traduction
    const urgenceDemandeur = this.selectedDemande.urgenceDemandeur === 'HAUTE' ? 'Haute' : 
                             this.selectedDemande.urgenceDemandeur === 'MOYENNE' ? 'Moyenne' : 
                             this.selectedDemande.urgenceDemandeur === 'BASSE' ? 'Basse' : 
                             'Non définie';
    doc.text(`Urgence du demandeur: ${urgenceDemandeur}`, 15, yPos);
    yPos += 6;
    
    // Urgence du responsable avec traduction
    const urgenceResponsable = this.selectedDemande.urgenceResponsable === 'HAUTE' ? 'Haute' : 
                               this.selectedDemande.urgenceResponsable === 'MOYENNE' ? 'Moyenne' : 
                               this.selectedDemande.urgenceResponsable === 'BASSE' ? 'Basse' : 
                               'Non définie';
    doc.text(`Urgence du responsable: ${urgenceResponsable}`, 15, yPos);
    yPos += 10;

    // Technicien affecté
    doc.setFont('helvetica', 'bold');
    doc.text('Technicien affecté', 15, yPos);
    yPos += 8;

    doc.setFont('helvetica', 'normal');
    // Construire le nom complet du technicien depuis les techniciens chargés
    let technicienNomComplet = 'Non affecté';
    if (this.selectedDemande.technicienId) {
      const technicien = this.techniciens.find(t => t.id === this.selectedDemande!.technicienId);
      if (technicien) {
        if (technicien.prenom && technicien.nom) {
          technicienNomComplet = `${technicien.prenom} ${technicien.nom}`;
        } else if (technicien.nom) {
          technicienNomComplet = technicien.nom;
        } else if (technicien.prenom) {
          technicienNomComplet = technicien.prenom;
        } else if (technicien.username) {
          technicienNomComplet = technicien.username;
        }
      }
    }
    doc.text(`Technicien: ${technicienNomComplet}`, 15, yPos);
    yPos += 10;

    // Responsable maintenance
    doc.setFont('helvetica', 'bold');
    doc.text('Responsable maintenance', 15, yPos);
    yPos += 8;

    doc.setFont('helvetica', 'normal');
    // Récupérer les informations du responsable connecté
    const responsableNom = this.username || 'Non défini';
    doc.text(`Responsable: ${responsableNom}`, 15, yPos);
    yPos += 10;

    // Description
    if (this.selectedDemande.description) {
      doc.setFont('helvetica', 'bold');
      doc.text('Description de la panne', 15, yPos);
      yPos += 8;

      doc.setFont('helvetica', 'normal');
      const descLines = doc.splitTextToSize(this.selectedDemande.description, pageWidth - 30);
      doc.text(descLines, 15, yPos);
      yPos += descLines.length * 6 + 5;
    }

    // Commentaire du responsable
    if (this.selectedDemande.commentaireInterne) {
      doc.setFont('helvetica', 'bold');
      doc.text('Commentaire du responsable', 15, yPos);
      yPos += 8;

      doc.setFont('helvetica', 'normal');
      const commentLines = doc.splitTextToSize(this.selectedDemande.commentaireInterne, pageWidth - 30);
      doc.text(commentLines, 15, yPos);
      yPos += commentLines.length * 6 + 5;
    }

    // Note du technicien
    if (this.selectedDemande.noteTechnicien) {
      if (yPos > 250) {
        doc.addPage();
        yPos = 20;
      }

      doc.setFont('helvetica', 'bold');
      doc.text('Rapport du technicien', 15, yPos);
      yPos += 8;

      doc.setFont('helvetica', 'normal');
      const noteLines = doc.splitTextToSize(this.selectedDemande.noteTechnicien, pageWidth - 30);
      doc.text(noteLines, 15, yPos);
      yPos += noteLines.length * 6 + 5;
    }

    // Pièces utilisées
    if (this.selectedDemande.piecesUtilisees && this.selectedDemande.piecesUtilisees.length > 0) {
      if (yPos > 240) {
        doc.addPage();
        yPos = 20;
      }

      doc.setFont('helvetica', 'bold');
      doc.text('Pièces utilisées', 15, yPos);
      yPos += 8;

      doc.setFont('helvetica', 'normal');
      this.selectedDemande.piecesUtilisees.forEach((piece: any) => {
        doc.text(`- ${piece.nom} (Quantité: ${piece.quantite})`, 20, yPos);
        yPos += 6;
      });
      yPos += 5;
    }

    // Dates d'intervention
    if (this.selectedDemande.dateDebutIntervention || this.selectedDemande.dateFinIntervention) {
      if (yPos > 250) {
        doc.addPage();
        yPos = 20;
      }

      doc.setFont('helvetica', 'bold');
      doc.text('Dates d\'intervention', 15, yPos);
      yPos += 8;

      doc.setFont('helvetica', 'normal');
      if (this.selectedDemande.dateDebutIntervention) {
        doc.text(`Début: ${new Date(this.selectedDemande.dateDebutIntervention).toLocaleDateString('fr-FR')}`, 15, yPos);
        yPos += 6;
      }
      if (this.selectedDemande.dateFinIntervention) {
        doc.text(`Fin: ${new Date(this.selectedDemande.dateFinIntervention).toLocaleDateString('fr-FR')}`, 15, yPos);
        yPos += 6;
      }
    }

    // Pied de page
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'italic');
      doc.text(
        `Page ${i} sur ${pageCount} - Généré le ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR')}`,
        pageWidth / 2,
        doc.internal.pageSize.getHeight() - 10,
        { align: 'center' }
      );
    }

    // Télécharger le PDF
    const fileName = `Intervention_${this.selectedDemande.id}_${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(fileName);

    this.showSuccessToast('Rapport PDF généré avec succès');
  }

  private onSucces(updated: any): void {
    // 🔥 Mapper la réponse API vers le format Demande
    const mappedDemande: Demande = {
      id: updated.id,
      titre: updated.titre,
      description: updated.description,
      demandeurNom: updated.demandeur
        ? `${updated.demandeur.prenom ?? ''} ${updated.demandeur.nom ?? ''}`.trim() || '—'
        : updated.demandeurNom ?? updated.signaleePar ?? '—',
      lieu: updated.lieu,
      typeEquipement: updated.typeEquipement,
      dateCreation: updated.dateCreation ? new Date(updated.dateCreation) : new Date(),
      statut: this.mapStatutApiToUi(updated.statut),
      statutInterventions: updated.statutInterventions ?? 'NON_DEMARREE',
      urgenceDemandeur: updated.priorite,
      urgenceResponsable: updated.prioriteResponsable ?? null,
      technicienId: updated.technicienId ?? null,
      commentaireInterne: updated.commentaireInterne ?? null,
      imageUrl: updated.imageUrl ?? updated.imagePath ?? null,
    };

    // 🔥 Mettre à jour la demande sélectionnée
    this.selectedDemande = mappedDemande;

    // 🔥 Mettre à jour la demande dans le tableau local IMMÉDIATEMENT
    const index = this.demandes.findIndex(d => d.id === mappedDemande.id);
    if (index !== -1) {
      this.demandes[index] = mappedDemande;
    }

    this.assignmentLocked = true;
    this.allowEditAssignment = false;
    this.markAsResolved = false;

    // 🔥 Fermer la modale
    this.showDetailsModal = false;

    // 🔥 Afficher un toast de succès
    this.showSuccessToast('Technicien affecté avec succès !');

    // 🔥 Recharger les demandes pour avoir les données à jour (en arrière-plan)
    this.chargerDemandesDepuisApi();

    // 🔥 Recharger les techniciens pour mettre à jour les stats
    this.chargerTechniciensDepuisApi();

    // 🔥 Synchroniser immédiatement avec les nouvelles données
    this.synchroniserTechniciensAvecDemandes();
    
    // 🔥 Rafraîchir l'UI avec les nouvelles données
    this.refreshDemandesUi();
  }



  private synchroniserTechniciensAvecDemandes(): void {
    if (!this.demandes?.length || !this.techniciens?.length) return;

    this.techniciens.forEach(tech => {
      const demandesAffectees = this.demandes.filter(
        d => d.technicienId === tech.id
      );

      const interventionsEnCours = demandesAffectees.filter(
        d => d.statut === 'EN_ATTENTE' || d.statut === 'EN_COURS'
      );

      const interventionsTerminees = demandesAffectees.filter(
        d => d.statut === 'RESOLUE'
      );

      // 🔥 NE PAS recalculer disponible - utiliser la valeur du backend (basée sur statut_interventions)
      // Le backend utilise statut_interventions='EN_COURS' pour déterminer si un technicien est occupé

      // stats locales (compatibilité)
      tech.nbInterventionsEnCours = interventionsEnCours.length;
      tech.nbInterventionsTerminees = interventionsTerminees.length;

      tech.interventionsEnCours = interventionsEnCours;
      tech.dernieresInterventions = interventionsTerminees.slice(0, 5);
    });

    // 🔄 pour l’affichage
    this.filteredTechniciens = [...this.techniciens];
  }



  private chargerTechniciensDepuisApi(): void {
    this.loadingTechniciens = true;
    this.errorTechniciens = null;

    this.utilisateursService.getTechniciens().subscribe({
      next: (list: UtilisateurDto[]) => {

        /* ===============================
         * 1) FILTRAGE TECHNICIENS
         * =============================== */
        const onlyTech: UtilisateurDto[] = (list ?? []).filter(
          (u: UtilisateurDto) =>
            String(u?.role ?? '').toUpperCase() === 'TECHNICIEN'
        );

        const items: TechnicienUI[] = onlyTech.map((u: UtilisateurDto) =>
          this.mapUserToTechnicienUI(u)
        );

        this.techniciens = items;
        this.techniciensAffectables = [...items];
        this.filteredTechniciens = [...items];
        this.synchroniserTechniciensAvecDemandes();


        /* ===============================
         * 2) CATÉGORIES
         * =============================== */
        this.technicienCategories = Array.from(
          new Set(
            this.techniciens
              .map(t => t.categorie ?? '')
              .filter(c => c.trim().length > 0)
          )
        ).sort((a, b) => a.localeCompare(b));

        this.applyTechnicienFilters();

        /* =====================================================
         * 3) 🔥🔥🔥 POINT CRITIQUE — SYNCHRO MODALE 🔥🔥🔥
         * ===================================================== */
        if (this.selectedDemande) {

          // technicien
          this.modalTechnicienId =
            this.selectedDemande.technicienId ?? null;

          // urgence responsable
          this.modalUrgenceResponsable =
            this.selectedDemande.prioriteResponsable ?? null;
        }

        this.loadingTechniciens = false;

        /* ===============================
         * 4) STATS
         * =============================== */
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
    this.applyStockFilters();
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



  applyStockFilters(): void {
    const q = (this.equipementSearchTerm || '').trim().toLowerCase();
    let list = [...this.equipementsStock];

    // Filtre par recherche
    if (q) {
      list = list.filter((e) => (e.type || '').toLowerCase().includes(q));
    }

    // Filtre par type
    if (this.equipementTypeFilter && this.equipementTypeFilter !== 'TOUS') {
      list = list.filter((e) => e.type === this.equipementTypeFilter);
    }

    this.filteredEquipementsStock = list;
    this.stockCurrentPage = 1;
    this.updateStockPagination();
  }

  private updateStockPagination(): void {
    const total = this.filteredEquipementsStock.length;
    this.stockTotalPages = Math.max(1, Math.ceil(total / this.stockPageSize));
    this.stockTotalPagesArray = Array.from({ length: this.stockTotalPages }, (_, i) => i + 1);

    const start = (this.stockCurrentPage - 1) * this.stockPageSize;
    const end = Math.min(start + this.stockPageSize, total);

    this.stockPageStartIndex = total === 0 ? 0 : start + 1;
    this.stockPageEndIndex = end;

    this.paginatedEquipementsStock = this.filteredEquipementsStock.slice(start, end);
  }

  nextStockPage(): void {
    if (this.stockCurrentPage < this.stockTotalPages) {
      this.stockCurrentPage++;
      this.updateStockPagination();
    }
  }

  previousStockPage(): void {
    if (this.stockCurrentPage > 1) {
      this.stockCurrentPage--;
      this.updateStockPagination();
    }
  }

  goToStockPage(page: number): void {
    if (page >= 1 && page <= this.stockTotalPages) {
      this.stockCurrentPage = page;
      this.updateStockPagination();
    }
  }

  getVisibleStockPages(): (number | string)[] {
    const maxVisible = 7;
    const pages: (number | string)[] = [];
    
    if (this.stockTotalPages <= maxVisible) {
      for (let i = 1; i <= this.stockTotalPages; i++) {
        pages.push(i);
      }
    } else {
      pages.push(1);
      
      let startPage: number;
      let endPage: number;
      
      if (this.stockCurrentPage <= 4) {
        startPage = 2;
        endPage = 6;
      } else if (this.stockCurrentPage >= this.stockTotalPages - 3) {
        startPage = this.stockTotalPages - 5;
        endPage = this.stockTotalPages - 1;
      } else {
        startPage = this.stockCurrentPage - 2;
        endPage = this.stockCurrentPage + 2;
      }
      
      if (startPage > 2) {
        pages.push('...');
      }
      
      for (let i = startPage; i <= endPage; i++) {
        pages.push(i);
      }
      
      if (endPage < this.stockTotalPages - 1) {
        pages.push('...');
      }
      
      pages.push(this.stockTotalPages);
    }
    
    return pages;
  }


  private chargerStatsTechniciens(): void {
    if (!this.techniciens?.length) return;

    this.loadingTechStats = true;
    this.errorTechStats = null;

    const requests = this.techniciens.map(t =>
      this.interventionsService.getStatsByTechnicien(t.id)
    );

    forkJoin(requests).subscribe({
      next: (statsList) => {
        const statsMap = new Map<number, StatsTechnicienResponse>();
        statsList.forEach(s => {
          if (s?.technicienId != null) {
            statsMap.set(s.technicienId, s);
          }
        });

        this.techniciens = this.techniciens.map(t => {
          const s = statsMap.get(t.id);

          const nbEnCours = s?.interventionsEnCours ?? 0;
          const nbTerminees = s?.interventionsTerminees ?? 0;

          const tempsMoyenHeures =
            s?.tempsMoyenMinutes != null
              ? Math.round((s.tempsMoyenMinutes / 60) * 10) / 10
              : 0;

          return {
            ...t,
            stats: {
              enCours: nbEnCours,
              terminees: nbTerminees,
              tempsMoyenHeures,
            },

            // uniquement pour affichage
            tempsMoyenResolutionHeures: tempsMoyenHeures,
          };
        });

        this.filteredTechniciens = [...this.techniciens];
        this.loadingTechStats = false;
      },
      error: (err) => {
        console.error(err);
        this.errorTechStats =
          'Impossible de charger les statistiques des techniciens.';
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
  paginatedEquipementsStock: any[] = [];
  
  // Pagination stock
  stockPageSize = 5;
  stockCurrentPage = 1;
  stockTotalPages = 1;
  stockTotalPagesArray: number[] = [];
  stockPageStartIndex = 0;
  stockPageEndIndex = 0;



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
  preventiveStatutFilter: 'TOUS' | 'PLANIFIEE' | 'EN_RETARD' | 'REALISEE' | 'ANNULEE' = 'TOUS';

  maintenancesPreventives: MaintenancePreventive[] = [];
  filteredMaintenancesPreventives: MaintenancePreventive[] = [];
  paginatedMaintenancesPreventives: MaintenancePreventive[] = [];
  
  // Pagination maintenances préventives
  preventivePageSize = 5;
  preventiveCurrentPage = 1;
  preventiveTotalPages = 1;
  preventiveTotalPagesArray: number[] = [];
  preventivePageStartIndex = 0;
  preventivePageEndIndex = 0;

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
  showResolutionImageInDetails = false;
  markAsResolved = false;

  get canExportSelected(): boolean {
    return !!this.selectedDemande && this.selectedDemande.statut === 'RESOLUE';
  }

  get isSaveDisabled(): boolean {
    if (!this.selectedDemande) return true;
    return false;
  }

  showTechnicienModal = false;
  selectedTechnicien: TechnicienUI | null = null;


  showPreventiveDetails = false;
  selectedPreventive: MaintenancePreventive | null = null;
// Lightbox
  isImageLightboxOpen = false;
  lightboxImageSrc: string | null = null;

  techniciensOptions: TechnicienOptionDto[] = [];
  loadingTechniciens = false;
  errorTechniciens: string | null = null;

  pannesEnCours: Panne[] = [];
  loadingPannes = false;


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
    private preventivesService: PreventivesService,
    private pannesResponsableService: PannesResponsableService,
    private demandeService: DemandeService,
    private pannesService : PannesService,
    private demandesPollingService: DemandesPollingService
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
    // Récupérer le nom complet de l'utilisateur connecté
    this.username = this.authService.getFullName();
    this.usernameInitial = this.username.charAt(0).toUpperCase();
    
    const userId = this.authService.getUserId();
    
    // 🔄 Démarrer le polling automatique pour le responsable
    if (userId) {
      this.demandesPollingService.startPolling(userId, 'RESPONSABLE_MAINTENANCE');
      
      // S'abonner aux demandes avec mises à jour automatiques
      this.pollingSubscription = this.demandesPollingService.demandesResponsable$.subscribe(pannes => {
        if (pannes && pannes.length >= 0) {
          this.demandes = this.mapPannesToDemandes(pannes);
          this.recalculateDemandesStats();
          this.applyDemandesFilters();
          this.recalculateStatusPercentages();
        }
      });
      
      // S'abonner à "Mes demandes" avec mises à jour automatiques
      this.mesDemandesSubscription = this.demandesPollingService.mesDemandes$.subscribe(pannes => {
        if (pannes && pannes.length >= 0) {
          this.mesDemandes = this.mapPannesToMesDemandes(pannes as any);
          this.appliquerFiltresMesDemandes();
        }
      });
    }

    // Charger les autres données
    this.filterPreventives();
    this.loadStock();
    this.loadEquipementsStock();
    this.loadMaintenancesPreventives();
    this.chargerTechniciensDepuisApi();
    this.synchroniserTechniciensAvecDemandes();
    this.chargerStatsTechniciens();
    // 🔥 SUPPRIMÉ - Le backend envoie déjà la valeur "occupe" correcte
    // this.chargerDisponibiliteTechniciens();
  }
  
  ngOnDestroy(): void {
    // Arrêter le polling automatique
    if (this.pollingSubscription) {
      this.pollingSubscription.unsubscribe();
    }
    if (this.mesDemandesSubscription) {
      this.mesDemandesSubscription.unsubscribe();
    }
    this.demandesPollingService.stopPolling();
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
    console.log('🔍 Mapping technicien:', dto); // Debug
    return {
      id: dto.id,
      nom: dto.nom ?? null,
      prenom: dto.prenom ?? null,
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
      occupe: dto.nbInterventionsEnCours > 0,
    };
  }

  filterMaintenancesPreventives(): void {
    const q = (this.preventiveSearchTerm ?? '').trim().toLowerCase();

    let list = [...this.maintenancesPreventives];

    // Filtre par statut
    if (this.preventiveStatutFilter !== 'TOUS') {
      list = list.filter(m => m.statut === this.preventiveStatutFilter);
    }

    // Filtre par recherche
    if (q) {
      list = list.filter(m =>
        (m.equipementReference ?? '').toLowerCase().includes(q) ||
        (m.typeEquipement ?? '').toLowerCase().includes(q) ||
        (m.responsable ?? '').toLowerCase().includes(q)
      );
    }

    this.filteredMaintenancesPreventives = list;

    // Réinitialiser à la page 1 et paginer
    this.preventiveCurrentPage = 1;
    this.updatePreventivePagination();
  }

  private updatePreventivePagination(): void {
    const total = this.filteredMaintenancesPreventives.length;
    this.preventiveTotalPages = Math.max(1, Math.ceil(total / this.preventivePageSize));
    this.preventiveTotalPagesArray = Array.from({ length: this.preventiveTotalPages }, (_, i) => i + 1);

    const start = (this.preventiveCurrentPage - 1) * this.preventivePageSize;
    const end = Math.min(start + this.preventivePageSize, total);

    this.preventivePageStartIndex = total === 0 ? 0 : start + 1;
    this.preventivePageEndIndex = end;

    this.paginatedMaintenancesPreventives = this.filteredMaintenancesPreventives.slice(start, end);
  }

  goToPreventivePage(page: number): void {
    if (page >= 1 && page <= this.preventiveTotalPages) {
      this.preventiveCurrentPage = page;
      this.updatePreventivePagination();
    }
  }

  nextPreventivePage(): void {
    if (this.preventiveCurrentPage < this.preventiveTotalPages) {
      this.preventiveCurrentPage++;
      this.updatePreventivePagination();
    }
  }

  previousPreventivePage(): void {
    if (this.preventiveCurrentPage > 1) {
      this.preventiveCurrentPage--;
      this.updatePreventivePagination();
    }
  }

  // Méthode pour obtenir les pages visibles des maintenances préventives (max 7)
  getVisiblePreventivePages(): (number | string)[] {
    const maxVisible = 7;
    const pages: (number | string)[] = [];
    
    if (this.preventiveTotalPages <= maxVisible) {
      for (let i = 1; i <= this.preventiveTotalPages; i++) {
        pages.push(i);
      }
    } else {
      pages.push(1);
      
      let startPage: number;
      let endPage: number;
      
      if (this.preventiveCurrentPage <= 4) {
        startPage = 2;
        endPage = 6;
      } else if (this.preventiveCurrentPage >= this.preventiveTotalPages - 3) {
        startPage = this.preventiveTotalPages - 5;
        endPage = this.preventiveTotalPages - 1;
      } else {
        startPage = this.preventiveCurrentPage - 2;
        endPage = this.preventiveCurrentPage + 2;
      }
      
      if (startPage > 2) {
        pages.push('...');
      }
      
      for (let i = startPage; i <= endPage; i++) {
        pages.push(i);
      }
      
      if (endPage < this.preventiveTotalPages - 1) {
        pages.push('...');
      }
      
      pages.push(this.preventiveTotalPages);
    }
    
    return pages;
  }

  loadMaintenancesPreventives(): void {
    this.loadingPreventives = true;
    this.errorPreventives = null;

    this.preventivesService.getAll().subscribe({
      next: (data) => {
        this.maintenancesPreventives = data ?? [];
        this.filteredMaintenancesPreventives = [...this.maintenancesPreventives];
        this.preventiveCurrentPage = 1;
        this.updatePreventivePagination();
        this.loadingPreventives = false;
      },
      error: (err: any) => {
        console.error('Erreur chargement maintenances préventives:', err);
        this.maintenancesPreventives = [];
        this.filteredMaintenancesPreventives = [];
        this.paginatedMaintenancesPreventives = [];
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

  mapOptionDtoToTechnicienUI(dto: TechnicienOptionDto): TechnicienUI {
      return {
        id: Number(dto.id),

        // ✅ Garder null si absent pour que getTechnicienFullName() fonctionne
        nom: dto.nom ?? null,
        prenom: dto.prenom ?? null,
        username: dto.username ?? null,

        // ✅ OptionDto a serviceUnite
        serviceUnite: dto.serviceUnite ?? null,
        categorie: 'Général',
        sousCategorie: undefined,

        specialites: [],

        // ✅ par défaut
        disponible: true,

        // ⚠️ stats inconnues à ce stade
        nbInterventionsEnCours: 0,
        nbInterventionsTerminees: 0,
        tempsMoyenResolutionHeures: 0,

        // ✅ obligatoire
        occupe: false,

        interventionsEnCours: [],
        dernieresInterventions: [],
        stats: null,

        loadingInterventions: false,
        errorInterventions: null,
        loadingStats: false,
        errorStats: null,
      };
    }




  loadTechniciensForPreventive(): void {
    this.loadingTechniciens = true;

    this.techniciensService.getTechniciens().subscribe({
      next: (data: TechnicienOptionDto[]) => {
        this.techniciens = (data ?? []).map(d => this.mapOptionDtoToTechnicienUI(d));
        this.loadingTechniciens = false;
      },
      error: (err: any) => {
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
        
        // Initialiser la pagination
        this.stockCurrentPage = 1;
        this.updateStockPagination();
      },
      error: (err: any) => {
        console.error(err);
        this.equipementsStock = [];
        this.filteredEquipementsStock = [];
        this.equipementTypes = [];
        this.paginatedEquipementsStock = [];
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

  /* ======================= LOGOUT MODAL ========================= */

  openLogoutModal(): void {
    this.userMenuOpen = false;
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
    this.authService.logout();
  }

  private lockBodyScroll(): void {
    document.body.classList.add('modal-open');
  }

  private unlockBodyScroll(): void {
    document.body.classList.remove('modal-open');
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

      return {
        id: p.id,
        titre: p.titre,
        description: p.description,

        demandeurNom: p.demandeur
          ? `${p.demandeur.prenom ?? ''} ${p.demandeur.nom ?? ''}`.trim() || '—'
          : (p as any).demandeurNom ?? p.signaleePar ?? '—',

        lieu: p.lieu,
        typeEquipement: p.typeEquipement,

        dateCreation: this.safeDateIso(p),
        statut: this.mapStatutApiToUi(p.statut),

        // 🟢 urgence demandeur
        urgenceDemandeur: this.mapPrioriteApiToUrgenceUi(p.priorite),

        // 🔴 urgence responsable
        urgenceResponsable:
          (p as any).prioriteResponsable ?? null,

        // 🔵 technicien
        technicienId:
          (p as any).technicien?.id ??
          (p as any).technicienId ??
          null,

        // 🟣 STATUT DE L’INTERVENTION (⭐ LA LIGNE MANQUANTE ⭐)
        statutInterventions:
          (p as any).statutInterventions ?? 'NON_DEMARREE',

        commentaireInterne:
          (p as any).commentaireInterne ?? null,

        imageUrl:
          (p as any).imageUrl ??
          (p as any).imagePath ??
          null,

        imageResolutionUrl:
          (p as any).imageResolutionPath
            ? this.resolveImageUrl((p as any).imageResolutionPath)
            : null,
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
      list = list.filter(d => d.statut === this.statusFilter);
    }

    if (this.urgenceFilter !== 'TOUTES') {
      list = list.filter(d => d.urgenceDemandeur === this.urgenceFilter);
    }

    if (this.searchTerm.trim().length > 0) {
      const term = this.searchTerm.toLowerCase();
      list = list.filter(d =>
        (d.titre || '').toLowerCase().includes(term) ||
        (d.demandeurNom || '').toLowerCase().includes(term) ||
        (d.statut || '').toLowerCase().includes(term)
      );
    }

    // ✅ TRI FINAL OBLIGATOIRE
    this.filteredDemandes = this.trierDemandesParStatut(list);

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

  // Méthode pour obtenir les pages visibles (max 7)
  getVisiblePages(): (number | string)[] {
    const maxVisible = 7;
    const pages: (number | string)[] = [];
    
    if (this.totalPages <= maxVisible) {
      // Si total <= 7, afficher toutes les pages
      for (let i = 1; i <= this.totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Toujours afficher la première page
      pages.push(1);
      
      let startPage: number;
      let endPage: number;
      
      if (this.currentPage <= 4) {
        // Début: afficher pages 2-6
        startPage = 2;
        endPage = 6;
      } else if (this.currentPage >= this.totalPages - 3) {
        // Fin: afficher les 5 dernières pages avant la dernière
        startPage = this.totalPages - 5;
        endPage = this.totalPages - 1;
      } else {
        // Milieu: afficher 2 pages avant et 2 après la page courante
        startPage = this.currentPage - 2;
        endPage = this.currentPage + 2;
      }
      
      // Ajouter "..." si nécessaire après la première page
      if (startPage > 2) {
        pages.push('...');
      }
      
      // Ajouter les pages du milieu
      for (let i = startPage; i <= endPage; i++) {
        pages.push(i);
      }
      
      // Ajouter "..." si nécessaire avant la dernière page
      if (endPage < this.totalPages - 1) {
        pages.push('...');
      }
      
      // Toujours afficher la dernière page
      pages.push(this.totalPages);
    }
    
    return pages;
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

  mesGoToPage(page: number): void {
    if (page >= 1 && page <= this.mesTotalPages) {
      this.mesCurrentPage = page;
      this.appliquerFiltresMesDemandes();
    }
  }

  // Méthode pour obtenir les pages visibles de "Mes demandes" (max 7)
  getVisibleMesPages(): (number | string)[] {
    const maxVisible = 7;
    const pages: (number | string)[] = [];
    
    if (this.mesTotalPages <= maxVisible) {
      for (let i = 1; i <= this.mesTotalPages; i++) {
        pages.push(i);
      }
    } else {
      pages.push(1);
      
      let startPage: number;
      let endPage: number;
      
      if (this.mesCurrentPage <= 4) {
        startPage = 2;
        endPage = 6;
      } else if (this.mesCurrentPage >= this.mesTotalPages - 3) {
        startPage = this.mesTotalPages - 5;
        endPage = this.mesTotalPages - 1;
      } else {
        startPage = this.mesCurrentPage - 2;
        endPage = this.mesCurrentPage + 2;
      }
      
      if (startPage > 2) {
        pages.push('...');
      }
      
      for (let i = startPage; i <= endPage; i++) {
        pages.push(i);
      }
      
      if (endPage < this.mesTotalPages - 1) {
        pages.push('...');
      }
      
      pages.push(this.mesTotalPages);
    }
    
    return pages;
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

  badgeClassIntervention(statut: string | null): string {
    switch (statut) {
      case 'EN_COURS':
        return 'status-pill info';
      case 'TERMINEE':
        return 'status-pill success';
      case 'ANNULEE':
        return 'status-pill danger';
      case 'NON_DEMARREE':
      default:
        return 'status-pill default';
    }
  }


  libelleStatutIntervention(statut: string | null | undefined): string {
    switch (statut) {
      case 'NON_DEMARREE':
        return 'Non démarrée';

      case 'EN_COURS':
        return 'En cours';

      case 'TERMINEE':
        return 'Terminée';

      case 'ANNULEE':
        return 'Annulée';

      default:
        return '—';
    }
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
    // 🔥 Recharger la demande depuis l'API pour avoir les données les plus récentes
    this.pannesRespApi.getPanneById(d.id).subscribe({
      next: (panneApi: any) => {
        // Mapper la panne API vers le format Demande
        const demandeAJour: Demande = {
          id: panneApi.id,
          titre: panneApi.titre,
          description: panneApi.description,
          demandeurNom: panneApi.demandeur
            ? `${panneApi.demandeur.prenom ?? ''} ${panneApi.demandeur.nom ?? ''}`.trim() || '—'
            : panneApi.signaleePar ?? '—',
          lieu: panneApi.lieu ?? '',
          typeEquipement: panneApi.typeEquipement ?? '',
          dateCreation: panneApi.dateSignalement ? new Date(panneApi.dateSignalement) : new Date(),
          statut: this.mapStatutApiToUi(panneApi.statut),
          statutInterventions: panneApi.statutInterventions ?? 'NON_DEMARREE',
          urgenceDemandeur: panneApi.priorite ?? 'MOYENNE',
          urgenceResponsable: panneApi.prioriteResponsable ?? null,
          technicienId: panneApi.technicien?.id ?? null,
          commentaireInterne: panneApi.commentaireInterne ?? null,
          imageUrl: panneApi.imagePath ?? null,
        };

        this.selectedDemande = demandeAJour;

        // 🔁 Toujours synchroniser les valeurs AVANT de désactiver
        this.modalTechnicienId = demandeAJour.technicienId ?? null;
        this.modalUrgenceResponsable = demandeAJour.urgenceResponsable;
        this.modalCommentaire = demandeAJour.commentaireInterne || '';

        // 🔒 verrouillage selon le statut réel
        this.assignmentLocked = demandeAJour.statut === 'EN_COURS' || demandeAJour.statut === 'RESOLUE';
        this.allowEditAssignment = false;

        // ✅ checkbox : cochée si déjà résolue
        this.markAsResolved = demandeAJour.statut === 'RESOLUE';

        this.showDetailsModal = true;
      },
      error: (err: any) => {
        console.error('Erreur lors du chargement de la demande:', err);
        // En cas d'erreur, utiliser les données locales
        const demandeAJour = this.demandes.find(demande => demande.id === d.id) ?? d;
        this.selectedDemande = demandeAJour;

        this.modalTechnicienId = demandeAJour.technicienId ?? null;
        this.modalUrgenceResponsable = demandeAJour.urgenceResponsable;
        this.modalCommentaire = demandeAJour.commentaireInterne || '';

        this.assignmentLocked = demandeAJour.statut === 'EN_COURS' || demandeAJour.statut === 'RESOLUE';
        this.allowEditAssignment = false;

        this.markAsResolved = demandeAJour.statut === 'RESOLUE';

        this.showDetailsModal = true;
      }
    });
  }

  openTechnicienModal(tech: TechnicienUI) {
    this.selectedTechnicien = tech;
    this.showTechnicienModal = true;

    // ===== STATS =====
    tech.loadingStats = true;
    tech.errorStats = null;

    this.techniciensService
      .getTechnicienDashboard(tech.id)
      .subscribe({
        next: (res) => {
          tech.stats = {
            // selon ta décision finale
            enCours: res.interventionsEnCours ?? 0,
            terminees: res.interventionsTerminees ?? 0,
            tempsMoyenMinutes: res.tempsMoyenRealisationMinutes ?? 0
          };

          tech.loadingStats = false;
        },
        error: () => {
          tech.errorStats = 'Erreur lors du chargement des statistiques';
          tech.loadingStats = false;
        }
      });

    // ===== INTERVENTIONS =====
    this.loadInterventionsTechnicien(tech);
  }

  loadInterventionsTechnicien(tech: TechnicienUI) {

    tech.loadingInterventions = true;
    tech.errorInterventions = null;

    forkJoin({
      enCours: this.pannesService.getEnCoursByTechnicien(tech.id),
      recentes: this.pannesService.getRecentesByTechnicien(tech.id)
    }).subscribe({
      next: ({ enCours, recentes }) => {
        tech.interventionsEnCours = enCours;
        tech.dernieresInterventions = recentes;
        tech.loadingInterventions = false;
      },
      error: () => {
        tech.errorInterventions = 'Erreur chargement interventions';
        tech.loadingInterventions = false;
      }
    });
  }

  enableAssignmentEdit(): void {
    this.allowEditAssignment = true;
    this.assignmentLocked = false;
  }

  get canSaveAffectation(): boolean {
    if (!this.selectedDemande) return false;

    const statut = this.selectedDemande.statut;

    // 🔴 CAS RÉSOLUTION
    if (this.markAsResolved === true) {
      return statut === 'EN_COURS';
    }

    // 🔒 verrou uniquement pour l’affectation
    if (this.assignmentLocked) return false;

    // 🔵 CAS AFFECTATION
    return !!this.modalTechnicienId && !!this.modalUrgenceResponsable;
  }

    private mapPanneDtoToDemande(p: PanneDto): Demande {
    return {
      id: p.id,
      titre: p.titre,
      description: p.description,

      demandeurNom: p.demandeur
        ? `${p.demandeur.prenom ?? ''} ${p.demandeur.nom ?? ''}`.trim()
        : '—',

      typeEquipement: p.typeEquipement ?? '—',
      lieu: p.lieu ?? '—',

      dateCreation: new Date(
        p.dateSignalement ??
        p.dateCreation ??
        p.createdAt ??
        Date.now()
      ),

      statut: p.statut === 'OUVERTE'
        ? 'EN_ATTENTE'
        : p.statut,

      // 🔵 urgence demandeur
      urgenceDemandeur: null,

      // 🔴 urgence responsable
      urgenceResponsable: this.mapPrioriteApiToUrgenceUi(p.priorite),

      technicienId: null,

      // ✅ image UI
      imageUrl: p.imagePath
        ? this.resolveImageUrl(p.imagePath)
        : null,
    };
  }



  closeDetailsModal(): void {
    this.showDetailsModal = false;
    this.selectedDemande = null;
    this.showImageInDetails = false;
    this.showResolutionImageInDetails = false;
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
              urgence: (this.demandes[index].urgenceDemandeur) as any,
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
            urgence: (updated.priorite ?? this.demandes[index].urgenceDemandeur) as any,

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

  compareById = (optionId: any, modelId: any): boolean => {
    return Number(optionId) === Number(modelId);
  };

  compareUrgence = (a: any, b: any): boolean => {
    return a === b;
  };





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
          (t.nom ?? '').toLowerCase().includes(this.technicienSearchTerm) ||
          (t.prenom ?? '').toLowerCase().includes(this.technicienSearchTerm) ||
          (t.username ?? '').toLowerCase().includes(this.technicienSearchTerm) ||
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


  ouvrirModalTechnicien(tech: TechnicienUI) {
    this.openTechnicienModal(tech);
  }


  private loadInterventionsEnCours(technicienId: number): void {

    this.interventionsService
      .getInterventionsEnCoursTechnicien(technicienId)
      .subscribe({
        next: data => {
          this.selectedTechnicien!.interventionsEnCours = data ?? [];
        },
        error: () => {
          this.selectedTechnicien!.interventionsEnCours = [];
        }
      });
  }


  // 🔥 OBSOLÈTE - Le backend envoie déjà la valeur "occupe" correcte
  // chargerDisponibiliteTechniciens(): void {
  //   this.techniciens.forEach(tech => {
  //     this.interventionsService
  //       .getInterventionsEnCoursTechnicien(tech.id)
  //       .subscribe({
  //         next: (interventions) => {
  //           tech.nbInterventionsEnCours = interventions.length;
  //           tech.disponible = interventions.length === 0;
  //         },
  //         error: () => {
  //           // en cas d'erreur → on considère NON disponible
  //           tech.disponible = false;
  //         }
  //       });
  //   });
  // }



  closeTechnicienModal(): void {
    this.showTechnicienModal = false;
    this.selectedTechnicien = null;
  }



  private mapUserToTechnicienUI(u: any): TechnicienUI {
    // =========================
    // 1) Nom et prénom séparés
    // =========================
    const prenomRaw = (u?.prenom ?? '').trim();
    const nomRaw = (u?.nom ?? '').trim();
    
    const prenom = prenomRaw.length > 0 ? prenomRaw : null;
    const nom = nomRaw.length > 0 ? nomRaw : null;

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
    // 🔥 Le backend retourne "enCours" et "occupe"
    const nbEnCours = Number(u?.enCours ?? u?.nbInterventionsEnCours ?? 0);

    // 🔥 Utiliser le champ "occupe" du backend si disponible, sinon calculer
    const disponible = typeof u?.occupe === 'boolean' 
        ? !u.occupe  // occupe = true signifie disponible = false
        : nbEnCours === 0;

    // =========================
    // 5) Statut actif/désactivé
    // =========================
    // 🔥 IMPORTANT : Mapper le champ enabled du backend
    const enabled = typeof u?.enabled === 'boolean' ? u.enabled : true;

    // =========================
    // 6) Construction finale
    // =========================
    return {
      id: Number(u?.id),

      nom: nom,
      prenom: prenom,
      categorie,
      sousCategorie,
      serviceUnite: serviceUnite || undefined,
      username: u?.username,

      specialites,

      disponible,

      nbInterventionsEnCours: nbEnCours,
      nbInterventionsTerminees: Number(u?.terminees ?? u?.nbInterventionsTerminees ?? 0),
      tempsMoyenResolutionHeures: Number(u?.tempsMoyen ?? u?.tempsMoyenResolutionHeures ?? 0) / 60, // Convertir minutes en heures

      // ✅ RÈGLE MÉTIER CLAIRE
      occupe: !disponible,  // occupe est l'inverse de disponible
      
      // ✅ Statut actif/désactivé
      enabled: enabled,

      interventionsEnCours: [],
      dernieresInterventions: [],

      stats: null,

      loadingInterventions: false,
      errorInterventions: null,
      loadingStats: false,
      errorStats: null,
    };

  }

  private calculerTempsMoyenHeures(demandes: any[]): number {
    if (!demandes || demandes.length === 0) {
      return 0;
    }

    const totalMs = demandes.reduce((sum, d) => {
      if (!d.dateDebut || !d.dateFin) {
        return sum;
      }

      const debut = new Date(d.dateDebut).getTime();
      const fin = new Date(d.dateFin).getTime();

      return sum + (fin - debut);
    }, 0);

    return Math.round((totalMs / demandes.length) / 3600000 * 10) / 10; // 1 décimale
  }

  private buildTechnicienStats(technicien: TechnicienUI, demandes: any[]) {

    const demandesTech = demandes.filter(
      d => d.technicienId === technicien.id
    );

    const enCours = demandesTech.filter(
      d => d.statut === 'EN_COURS'
    );

    const terminees = demandesTech.filter(
      d => d.statut === 'RESOLUE'
    );

    technicien.stats = {
      enCours: enCours.length,
      terminees: terminees.length,
      tempsMoyenMinutes: this.calculerTempsMoyenHeures(terminees)
    };

    // 🔁 cohérence avec ton existant
    technicien.nbInterventionsEnCours = enCours.length;
    technicien.nbInterventionsTerminees = terminees.length;
    technicien.tempsMoyenResolutionHeures =
      technicien.stats?.tempsMoyenMinutes ?? 0;

    // 🔥 NE PAS recalculer disponible - utiliser la valeur du backend
    // technicien.disponible = enCours.length === 0;
  }




  formatTechnicienOption(t: TechnicienUI): string {
    const base = t.username ? t.username : (t.nom ?? 'Technicien');
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

  setPreventiveStatutFilter(filter: 'TOUS' | 'PLANIFIEE' | 'EN_RETARD' | 'REALISEE' | 'ANNULEE'): void {
    this.preventiveStatutFilter = filter;
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
      const techName = this.getTechnicienFullName(t);
      this.selectedPreventiveTechnicienLabel = spec ? `${techName} (${spec})` : techName;
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

  annulerMaintenance(): void {
    if (!this.selectedPreventive) return;
    this.showAnnulerMaintenanceConfirm = true;
  }

  confirmAnnulerMaintenance(): void {
    if (!this.selectedPreventive) return;

    this.preventivesService.annuler(this.selectedPreventive.id).subscribe({
      next: () => {
        this.showSuccessToast('Maintenance préventive arrêtée avec succès');
        this.showAnnulerMaintenanceConfirm = false;
        this.closePreventiveDetails();
        this.loadMaintenancesPreventives();
      },
      error: (err) => {
        console.error('Erreur lors de l\'arrêt de la maintenance:', err);
        this.showErrorToast('Erreur lors de l\'arrêt de la maintenance');
        this.showAnnulerMaintenanceConfirm = false;
      }
    });
  }

  cancelAnnulerMaintenance(): void {
    this.showAnnulerMaintenanceConfirm = false;
  }

  parsePiecesUtilisees(piecesJson: string | null | undefined): Array<{ nom: string; quantite: number }> {
    if (!piecesJson) return [];
    try {
      return JSON.parse(piecesJson);
    } catch (e) {
      console.error('Erreur parsing pièces:', e);
      return [];
    }
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

  getImageUrl(path?: string | null): string | null {
    if (!path) return null;

    // déjà une URL complète
    if (path.startsWith('http')) {
      return path;
    }

    // forcer le backend
    return environment.backendUrl + '/' + path.replace(/^\/+/, '');
  }


  private readonly ordreStatut: Record<string, number> = {
    EN_ATTENTE: 1,
    EN_COURS: 2,
    RESOLUE: 3,
  };

  private trierDemandesParStatut(demandes: any[]): any[] {
    // 🔥 Si on filtre par un statut spécifique
    if (this.statusFilter !== 'TOUTES') {
      return [...demandes].sort((a, b) => {
        const dateA = new Date(a.dateCreation).getTime();
        const dateB = new Date(b.dateCreation).getTime();
        
        // EN_ATTENTE : les plus anciennes en haut (tri croissant)
        if (this.statusFilter === 'EN_ATTENTE') {
          return dateA - dateB;
        }
        
        // EN_COURS et RESOLUE : les plus récentes en haut (tri décroissant)
        return dateB - dateA;
      });
    }

    // 🔥 Si on affiche TOUTES les demandes
    // Grouper par statut, puis trier chaque groupe
    const ordreStatut: { [key: string]: number } = {
      'EN_ATTENTE': 1,
      'EN_COURS': 2,
      'RESOLUE': 3,
    };

    return [...demandes].sort((a, b) => {
      const ordreA = ordreStatut[a.statut] ?? 99;
      const ordreB = ordreStatut[b.statut] ?? 99;
      
      // Si même statut, trier par date
      if (ordreA === ordreB) {
        const dateA = new Date(a.dateCreation).getTime();
        const dateB = new Date(b.dateCreation).getTime();
        
        // EN_ATTENTE : les plus anciennes en haut
        if (a.statut === 'EN_ATTENTE') {
          return dateA - dateB;
        }
        
        // EN_COURS et RESOLUE : les plus récentes en haut
        return dateB - dateA;
      }
      
      // Sinon, trier par ordre de statut
      return ordreA - ordreB;
    });
  }


  appliquerFiltre() {
    this.filteredDemandes = this.trierDemandesParStatut(
      this.demandes.filter(d => true)

    );
  }

  // 🔥 Méthodes pour afficher les toasts
  showSuccessToast(message: string): void {
    this.toastMessage = message;
    this.toastType = 'success';
    this.showToast = true;

    // Masquer automatiquement après 3 secondes
    setTimeout(() => {
      this.showToast = false;
    }, 3000);
  }

  showErrorToast(message: string): void {
    this.toastMessage = message;
    this.toastType = 'error';
    this.showToast = true;

    setTimeout(() => {
      this.showToast = false;
    }, 3000);
  }

  closeToast(): void {
    this.showToast = false;
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

  onNotificationClicked(notification: any): void {
    console.log('🔔 Notification cliquée (responsable):', notification);

    // Si c'est une notification de panne/demande
    if (notification.entityType === 'PANNE' && notification.entityId) {
      // Charger les demandes si pas encore chargées
      if (this.demandes.length === 0) {
        this.chargerDemandesDepuisApi();
      }

      // Chercher la demande correspondante
      const demande = this.demandes.find(d => d.id === notification.entityId);

      if (demande) {
        // Naviguer vers le dashboard et ouvrir la modale
        this.setActive('dashboard');
        setTimeout(() => {
          this.openDemandeDetails(demande);
        }, 300);
      } else {
        // La demande n'est pas encore chargée, recharger les données
        console.log('⚠️ Demande non trouvée, rechargement des données...');
        this.chargerDemandesDepuisApi();

        // Attendre que les données soient chargées puis ouvrir la modale
        setTimeout(() => {
          const demandeReloaded = this.demandes.find(d => d.id === notification.entityId);
          if (demandeReloaded) {
            this.setActive('dashboard');
            setTimeout(() => {
              this.openDemandeDetails(demandeReloaded);
            }, 300);
          } else {
            console.error('❌ Demande toujours introuvable après rechargement');
            this.showErrorToast('Demande introuvable');
          }
        }, 1000);
      }
    }
  }

}
