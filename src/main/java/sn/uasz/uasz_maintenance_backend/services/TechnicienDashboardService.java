package sn.uasz.uasz_maintenance_backend.services;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import sn.uasz.uasz_maintenance_backend.dtos.TechnicienDashboardDto;
import sn.uasz.uasz_maintenance_backend.dtos.TechnicienDashboardResponse;
import sn.uasz.uasz_maintenance_backend.entities.Intervention;
import sn.uasz.uasz_maintenance_backend.entities.InterventionPiece;
import sn.uasz.uasz_maintenance_backend.entities.Utilisateur;
import sn.uasz.uasz_maintenance_backend.enums.Role;
import sn.uasz.uasz_maintenance_backend.enums.StatutIntervention;
import sn.uasz.uasz_maintenance_backend.exceptions.ResourceNotFoundException;
import sn.uasz.uasz_maintenance_backend.repositories.InterventionPieceRepository;
import sn.uasz.uasz_maintenance_backend.repositories.InterventionRepository;
import sn.uasz.uasz_maintenance_backend.repositories.PanneRepository;
import sn.uasz.uasz_maintenance_backend.repositories.UtilisateurRepository;

import java.math.BigDecimal;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.List;
import java.util.OptionalDouble;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class TechnicienDashboardService {

    private final UtilisateurRepository utilisateurRepository;
    private final InterventionRepository interventionRepository;
    private final InterventionPieceRepository interventionPieceRepository;
    private final PanneRepository panneRepository;


    /**
     * Méthode appelée par le controller /api/techniciens/{id}/dashboard
     */
    public TechnicienDashboardResponse getDashboard(Long technicienId) {

        // 1️⃣ Vérifier que le technicien existe
        Utilisateur technicien = utilisateurRepository.findById(technicienId)
                .orElseThrow(() -> new RuntimeException("Technicien introuvable"));

        // 2️⃣ Récupération des stats depuis la base
        Long enCours = panneRepository.countEnCours(technicienId);
        Long terminees = panneRepository.countTerminees(technicienId);

        Double tempsMoyenHeures = panneRepository.tempsMoyenHeures(technicienId);

        // 3️⃣ Conversion heures → minutes (avec sécurité null)
        Long tempsMoyenMinutes = (tempsMoyenHeures != null)
                ? Math.round(tempsMoyenHeures * 60)
                : 0L;

        // 4️⃣ Création du DTO (⚠️ AVANT toute utilisation)
        TechnicienDashboardDto dto = TechnicienDashboardDto.builder()
                .technicienId(technicien.getId())
                .username(technicien.getUsername())
                .email(technicien.getEmail())
                .interventionsEnCours(enCours != null ? enCours : 0L)
                .interventionsTerminees(terminees != null ? terminees : 0L)
                .tempsMoyenRealisationMinutes(tempsMoyenMinutes)
                .build();

        // 5️⃣ Mapping vers la réponse finale
        return TechnicienDashboardResponse.builder()
                .technicienId(dto.getTechnicienId())
                .username(dto.getUsername())
                .email(dto.getEmail())
                .totalInterventions(
                        dto.getInterventionsEnCours()
                                + dto.getInterventionsTerminees()
                )
                .interventionsPlanifiees(dto.getInterventionsPlanifiees())
                .interventionsEnCours(dto.getInterventionsEnCours())
                .interventionsTerminees(dto.getInterventionsTerminees())
                .interventionsAnnulees(dto.getInterventionsAnnulees())
                .derniereInterventionDebut(dto.getDerniereInterventionDebut())
                .derniereInterventionTerminee(dto.getDerniereInterventionTerminee())
                .tempsMoyenRealisationMinutes(dto.getTempsMoyenRealisationMinutes())
                .totalPiecesConsommees(dto.getTotalPiecesConsommees())
                .coutTotalPieces(dto.getCoutTotalPieces())
                .build();
    }




    /**
     * Logique métier : statistiques d’un technicien donné.
     */
    public TechnicienDashboardDto getDashboardForTechnicien(Long technicienId) {

        Utilisateur technicien = utilisateurRepository.findById(technicienId)
                .orElseThrow(() -> new RuntimeException("Technicien introuvable"));

        Long enCours = panneRepository.countEnCours(technicienId);
        Long terminees = panneRepository.countTerminees(technicienId);

        return TechnicienDashboardDto.builder()
                .technicienId(technicien.getId())
                .username(technicien.getUsername())
                .email(technicien.getEmail())
                .interventionsEnCours(enCours != null ? enCours : 0)
                .interventionsTerminees(terminees != null ? terminees : 0)
                .totalInterventions(
                        (enCours != null ? enCours : 0)
                                + (terminees != null ? terminees : 0)
                )
                .build();
    }
}
