export interface Demande {
  id: number;
  titre: string;
  description?: string;

  demandeurNom: string;
  lieu?: string;
  typeEquipement?: string;

  dateCreation: Date;
  statut: 'EN_ATTENTE' | 'EN_COURS' | 'RESOLUE';

  urgenceDemandeur?: 'BASSE' | 'MOYENNE' | 'HAUTE' | null;
  urgenceResponsable?: 'BASSE' | 'MOYENNE' | 'HAUTE' | null;

  technicienId?: number | null;

  imageUrl?: string | null;
}
