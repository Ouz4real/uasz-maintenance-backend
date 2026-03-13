package sn.uasz.uasz_maintenance_backend.dtos;

import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
public class EquipementStatsDto {

    // Statistiques globales
    private long totalEquipements;
    private long equipementsEnService;
    private long equipementsEnPanne;
    private long equipementsHorsService;
    private double tauxDisponibilite; // (enService / total) * 100

    // Répartition par type
    private List<EquipementParTypeDto> repartitionParType;

    // Répartition par localisation
    private List<EquipementParLocalisationDto> repartitionParLocalisation;

    // Top équipements problématiques
    private List<EquipementProblematiqueDto> topEquipementsProblematiques;

    // Indicateurs de performance
    private Double mtbfMoyenJours; // Mean Time Between Failures (en jours)
    private Double ageMoyenAnnees; // Âge moyen du parc (en années)
    private long nombreEquipementsAvecPannes; // Équipements ayant au moins une panne

    @Data
    @Builder
    public static class EquipementParTypeDto {
        private String type;
        private long nombre;
        private long enService;
        private long enPanne;
        private long horsService;
    }

    @Data
    @Builder
    public static class EquipementParLocalisationDto {
        private String localisation;
        private long nombre;
        private long enService;
        private long enPanne;
        private long horsService;
    }

    @Data
    @Builder
    public static class EquipementProblematiqueDto {
        private Long id;
        private String code;
        private String type;        // Type extrait du libellé
        private String libelle;
        private String localisation;
        private long nombrePannes;
        private String etat;
    }
}
