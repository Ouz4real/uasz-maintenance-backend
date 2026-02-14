export interface EquipementApi {
  id: number;
  code?: string;
  libelle?: string;
  description?: string | null;
  dateAcquisition?: string | null;
  etat?: string;
  localisation?: string | null;
}
