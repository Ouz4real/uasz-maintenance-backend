package sn.uasz.uasz_maintenance_backend.services.impl;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import sn.uasz.uasz_maintenance_backend.dtos.EquipementStatsDto;
import sn.uasz.uasz_maintenance_backend.entities.Equipement;
import sn.uasz.uasz_maintenance_backend.entities.Panne;
import sn.uasz.uasz_maintenance_backend.repositories.EquipementRepository;
import sn.uasz.uasz_maintenance_backend.repositories.PanneRepository;
import sn.uasz.uasz_maintenance_backend.services.EquipementStatsService;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class EquipementStatsServiceImpl implements EquipementStatsService {

    private final EquipementRepository equipementRepository;
    private final PanneRepository panneRepository;

    @Override
    public EquipementStatsDto getEquipementStats() {
        List<Equipement> allEquipements = equipementRepository.findAll();
        long total = allEquipements.size();

        // Statistiques globales
        long enService = equipementRepository.countByEtat("EN_SERVICE");
        long enPanne = equipementRepository.countByEtat("EN_PANNE");
        long horsService = equipementRepository.countByEtat("HORS_SERVICE");
        double tauxDisponibilite = total > 0 ? (enService * 100.0 / total) : 0.0;

        // Types d'équipements les plus signalés (depuis les pannes)
        List<Object[]> typesSignales = panneRepository.countPannesByTypeEquipement();
        
        // Répartition par type (basé sur les signalements de pannes)
        List<EquipementStatsDto.EquipementParTypeDto> repartitionParType = typesSignales.stream()
                .map(row -> {
                    String typeEquipement = (String) row[0];
                    Long panneCount = ((Number) row[1]).longValue();
                    return EquipementStatsDto.EquipementParTypeDto.builder()
                            .type(typeEquipement != null && !typeEquipement.isEmpty() ? typeEquipement : "Non spécifié")
                            .nombre(panneCount)
                            .enService(0L)  // Non applicable pour les signalements
                            .enPanne(panneCount)
                            .horsService(0L)
                            .build();
                })
                .sorted(Comparator.comparing(EquipementStatsDto.EquipementParTypeDto::getNombre).reversed())
                .collect(Collectors.toList());

        // Répartition par localisation (basé sur les signalements de pannes)
        List<Object[]> localisationsSignalees = panneRepository.countPannesByLocalisation();
        
        List<EquipementStatsDto.EquipementParLocalisationDto> repartitionParLocalisation = localisationsSignalees.stream()
                .map(row -> {
                    String localisation = (String) row[0];
                    Long panneCount = ((Number) row[1]).longValue();
                    return EquipementStatsDto.EquipementParLocalisationDto.builder()
                            .localisation(localisation != null && !localisation.isEmpty() ? localisation : "Non spécifié")
                            .nombre(panneCount)
                            .enService(0L)  // Non applicable pour les signalements
                            .enPanne(panneCount)
                            .horsService(0L)
                            .build();
                })
                .sorted(Comparator.comparing(EquipementStatsDto.EquipementParLocalisationDto::getNombre).reversed())
                .collect(Collectors.toList());

        // Liste complète des équipements problématiques (même données que repartitionParType)
        List<EquipementStatsDto.EquipementProblematiqueDto> topProblematiques = typesSignales.stream()
                .map(row -> {
                    String typeEquipement = (String) row[0];
                    Long panneCount = ((Number) row[1]).longValue();
                    return EquipementStatsDto.EquipementProblematiqueDto.builder()
                            .id(null)
                            .code(null)
                            .type(typeEquipement != null && !typeEquipement.isEmpty() ? typeEquipement : "Non spécifié")
                            .libelle(null)
                            .localisation(null)
                            .nombrePannes(panneCount)
                            .etat(null)
                            .build();
                })
                .filter(dto -> dto.getNombrePannes() > 0)
                .sorted(Comparator.comparing(EquipementStatsDto.EquipementProblematiqueDto::getNombrePannes).reversed())
                .collect(Collectors.toList());

        // Indicateurs de performance
        List<Object[]> equipementsWithPannes = equipementRepository.findEquipementsWithPanneCount();
        long nombreEquipementsAvecPannes = equipementsWithPannes.stream()
                .filter(row -> ((Number) row[1]).longValue() > 0)
                .count();

        // Âge moyen du parc
        double ageMoyenAnnees = allEquipements.stream()
                .filter(e -> e.getDateAcquisition() != null)
                .mapToLong(e -> ChronoUnit.YEARS.between(e.getDateAcquisition(), LocalDate.now()))
                .average()
                .orElse(0.0);

        // MTBF moyen (simplifié - nombre de jours / nombre de pannes)
        Double mtbfMoyenJours = null;
        if (nombreEquipementsAvecPannes > 0) {
            long totalPannes = panneRepository.count();
            if (totalPannes > 0) {
                long joursTotal = allEquipements.stream()
                        .filter(e -> e.getDateAcquisition() != null)
                        .mapToLong(e -> ChronoUnit.DAYS.between(e.getDateAcquisition(), LocalDate.now()))
                        .sum();
                mtbfMoyenJours = joursTotal / (double) totalPannes;
            }
        }

        return EquipementStatsDto.builder()
                .totalEquipements(total)
                .equipementsEnService(enService)
                .equipementsEnPanne(enPanne)
                .equipementsHorsService(horsService)
                .tauxDisponibilite(Math.round(tauxDisponibilite * 100.0) / 100.0)
                .repartitionParType(repartitionParType)
                .repartitionParLocalisation(repartitionParLocalisation)
                .topEquipementsProblematiques(topProblematiques)
                .mtbfMoyenJours(mtbfMoyenJours != null ? Math.round(mtbfMoyenJours * 100.0) / 100.0 : null)
                .ageMoyenAnnees(Math.round(ageMoyenAnnees * 100.0) / 100.0)
                .nombreEquipementsAvecPannes(nombreEquipementsAvecPannes)
                .build();
    }

    @Override
    public EquipementStatsDto getEquipementStatsByPeriode(String dateDebutStr, String dateFinStr) {
        // Parser les dates avec le même formatter que pour les autres endpoints
        DateTimeFormatter formatter = DateTimeFormatter.ISO_LOCAL_DATE;
        LocalDate dateDebut = LocalDate.parse(dateDebutStr, formatter);
        LocalDate dateFin = LocalDate.parse(dateFinStr, formatter);
        
        // Convertir en LocalDateTime pour la comparaison
        LocalDateTime dateTimeDebut = dateDebut.atStartOfDay();
        LocalDateTime dateTimeFin = dateFin.atTime(23, 59, 59);

        List<Equipement> allEquipements = equipementRepository.findAll();
        long total = allEquipements.size();

        // Statistiques globales (ne changent pas avec la période)
        long enService = equipementRepository.countByEtat("EN_SERVICE");
        long enPanne = equipementRepository.countByEtat("EN_PANNE");
        long horsService = equipementRepository.countByEtat("HORS_SERVICE");
        double tauxDisponibilite = total > 0 ? (enService * 100.0 / total) : 0.0;

        // Types d'équipements les plus signalés DANS LA PÉRIODE
        List<Panne> pannesDansPeriode = panneRepository.findAll().stream()
                .filter(p -> p.getDateSignalement() != null)
                .filter(p -> !p.getDateSignalement().isBefore(dateTimeDebut) && 
                            !p.getDateSignalement().isAfter(dateTimeFin))
                .collect(Collectors.toList());
        
        // Grouper par type d'équipement
        Map<String, Long> typeCount = pannesDansPeriode.stream()
                .filter(p -> p.getTypeEquipement() != null && !p.getTypeEquipement().isEmpty())
                .collect(Collectors.groupingBy(
                        Panne::getTypeEquipement,
                        Collectors.counting()
                ));
        
        // Répartition par type (basé sur les signalements de pannes dans la période)
        List<EquipementStatsDto.EquipementParTypeDto> repartitionParType = typeCount.entrySet().stream()
                .map(entry -> EquipementStatsDto.EquipementParTypeDto.builder()
                        .type(entry.getKey())
                        .nombre(entry.getValue())
                        .enService(0L)
                        .enPanne(entry.getValue())
                        .horsService(0L)
                        .build())
                .sorted(Comparator.comparing(EquipementStatsDto.EquipementParTypeDto::getNombre).reversed())
                .collect(Collectors.toList());

        // Répartition par localisation (basé sur les signalements de pannes dans la période)
        Map<String, Long> localisationCount = pannesDansPeriode.stream()
                .filter(p -> p.getLieu() != null && !p.getLieu().isEmpty())
                .collect(Collectors.groupingBy(
                        Panne::getLieu,
                        Collectors.counting()
                ));
        
        List<EquipementStatsDto.EquipementParLocalisationDto> repartitionParLocalisation = localisationCount.entrySet().stream()
                .map(entry -> EquipementStatsDto.EquipementParLocalisationDto.builder()
                        .localisation(entry.getKey())
                        .nombre(entry.getValue())
                        .enService(0L)
                        .enPanne(entry.getValue())
                        .horsService(0L)
                        .build())
                .sorted(Comparator.comparing(EquipementStatsDto.EquipementParLocalisationDto::getNombre).reversed())
                .collect(Collectors.toList());

        // Liste complète des équipements problématiques dans la période
        List<EquipementStatsDto.EquipementProblematiqueDto> topProblematiques = typeCount.entrySet().stream()
                .map(entry -> EquipementStatsDto.EquipementProblematiqueDto.builder()
                        .id(null)
                        .code(null)
                        .type(entry.getKey())
                        .libelle(null)
                        .localisation(null)
                        .nombrePannes(entry.getValue())
                        .etat(null)
                        .build())
                .filter(dto -> dto.getNombrePannes() > 0)
                .sorted(Comparator.comparing(EquipementStatsDto.EquipementProblematiqueDto::getNombrePannes).reversed())
                .collect(Collectors.toList());

        // Indicateurs de performance
        List<Object[]> equipementsWithPannes = equipementRepository.findEquipementsWithPanneCount();
        long nombreEquipementsAvecPannes = equipementsWithPannes.stream()
                .filter(row -> ((Number) row[1]).longValue() > 0)
                .count();

        // Âge moyen du parc
        double ageMoyenAnnees = allEquipements.stream()
                .filter(e -> e.getDateAcquisition() != null)
                .mapToLong(e -> ChronoUnit.YEARS.between(e.getDateAcquisition(), LocalDate.now()))
                .average()
                .orElse(0.0);

        // MTBF moyen
        Double mtbfMoyenJours = null;
        if (nombreEquipementsAvecPannes > 0) {
            long totalPannes = pannesDansPeriode.size();
            if (totalPannes > 0) {
                long joursTotal = allEquipements.stream()
                        .filter(e -> e.getDateAcquisition() != null)
                        .mapToLong(e -> ChronoUnit.DAYS.between(e.getDateAcquisition(), LocalDate.now()))
                        .sum();
                mtbfMoyenJours = joursTotal / (double) totalPannes;
            }
        }

        return EquipementStatsDto.builder()
                .totalEquipements(total)
                .equipementsEnService(enService)
                .equipementsEnPanne(enPanne)
                .equipementsHorsService(horsService)
                .tauxDisponibilite(Math.round(tauxDisponibilite * 100.0) / 100.0)
                .repartitionParType(repartitionParType)
                .repartitionParLocalisation(repartitionParLocalisation)
                .topEquipementsProblematiques(topProblematiques)
                .mtbfMoyenJours(mtbfMoyenJours != null ? Math.round(mtbfMoyenJours * 100.0) / 100.0 : null)
                .ageMoyenAnnees(Math.round(ageMoyenAnnees * 100.0) / 100.0)
                .nombreEquipementsAvecPannes(nombreEquipementsAvecPannes)
                .build();
    }

    /**
     * Extrait le type d'équipement depuis le libellé
     * Ex: "Vidéoprojecteur Amphi 1" -> "Vidéoprojecteur"
     * Ex: "Ordinateur Salle 3" -> "Ordinateur"
     */
    private String extractTypeFromLibelle(String libelle) {
        if (libelle == null || libelle.trim().isEmpty()) {
            return "Non spécifié";
        }
        
        // Séparer par espace et prendre le premier mot (généralement le type)
        String[] parts = libelle.trim().split("\\s+");
        if (parts.length > 0) {
            return parts[0];
        }
        
        return libelle;
    }
}
