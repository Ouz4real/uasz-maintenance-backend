export interface EquipementStatsDto {
  totalEquipements: number;
  equipementsEnService: number;
  equipementsEnPanne: number;
  equipementsHorsService: number;
  tauxDisponibilite: number;
  repartitionParType: EquipementParTypeDto[];
  repartitionParLocalisation: EquipementParLocalisationDto[];
  topEquipementsProblematiques: EquipementProblematiqueDto[];
  mtbfMoyenJours: number | null;
  ageMoyenAnnees: number;
  nombreEquipementsAvecPannes: number;
}

export interface EquipementParTypeDto {
  type: string;
  nombre: number;
  enService: number;
  enPanne: number;
  horsService: number;
}

export interface EquipementParLocalisationDto {
  localisation: string;
  nombre: number;
  enService: number;
  enPanne: number;
  horsService: number;
}

export interface EquipementProblematiqueDto {
  id: number;
  code: string;
  type: string;
  libelle: string;
  localisation: string;
  nombrePannes: number;
  etat: string;
}
