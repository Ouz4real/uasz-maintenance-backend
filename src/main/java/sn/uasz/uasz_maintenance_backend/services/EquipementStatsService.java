package sn.uasz.uasz_maintenance_backend.services;

import sn.uasz.uasz_maintenance_backend.dtos.EquipementStatsDto;

public interface EquipementStatsService {
    EquipementStatsDto getEquipementStats();
    EquipementStatsDto getEquipementStatsByPeriode(String dateDebut, String dateFin);
}
