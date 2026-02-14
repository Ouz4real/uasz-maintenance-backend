export interface Demande {
  id: number;
  titre: string;
  description?: string;

  demandeurNom: string;
  lieu?: string;
  typeEquipement?: string;

  dateCreation: Date;
  statut: 'EN_ATTENTE' | 'EN_COURS' | 'RESOLUE';
  statutInterventions?: 'NON_DEMARREE' | 'EN_COURS' | 'TERMINEE' | 'ANNULEE';

  urgenceDemandeur?: 'BASSE' | 'MOYENNE' | 'HAUTE' | null;
  urgenceResponsable: 'BASSE' | 'MOYENNE' | 'HAUTE' | null;

  technicienId?: number | null;
  commentaireInterne?: string | null;

  imageUrl?: string | null;
}
