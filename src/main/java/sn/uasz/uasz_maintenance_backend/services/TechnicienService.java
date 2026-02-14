package sn.uasz.uasz_maintenance_backend.services;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import sn.uasz.uasz_maintenance_backend.dtos.TechnicienUIResponse;
import sn.uasz.uasz_maintenance_backend.entities.Utilisateur;
import sn.uasz.uasz_maintenance_backend.enums.Role;
import sn.uasz.uasz_maintenance_backend.enums.StatutInterventions;
import sn.uasz.uasz_maintenance_backend.repositories.PanneRepository;
import sn.uasz.uasz_maintenance_backend.repositories.UtilisateurRepository;

import java.util.List;

@Service
@RequiredArgsConstructor
public class TechnicienService {

    private final UtilisateurRepository utilisateurRepository;
    private final PanneRepository panneRepository;

    public List<TechnicienUIResponse> getTechniciensSupervision() {

        List<Utilisateur> techniciens =
                utilisateurRepository.findByRole(Role.TECHNICIEN);


        return techniciens.stream().map(technicien -> {

            TechnicienUIResponse dto = new TechnicienUIResponse();
            dto.setId(technicien.getId());
            dto.setNom(technicien.getNom());
            dto.setPrenom(technicien.getPrenom());
            dto.setUsername(technicien.getUsername());
            dto.setEmail(technicien.getEmail());
            dto.setServiceUnite(technicien.getServiceUnite());
            dto.setDepartement(technicien.getDepartement());
            dto.setTelephone(technicien.getTelephone());
            dto.setRole(technicien.getRole().name());

            // 🔥 Récupération des statistiques depuis PanneRepository
            Long enCours = panneRepository.countEnCours(technicien.getId());
            Long terminees = panneRepository.countTerminees(technicien.getId());
            Double tempsMoyenHeures = panneRepository.tempsMoyenHeures(technicien.getId());

            // 🔥 Remplissage des stats
            dto.setEnCours(enCours != null ? enCours : 0L);
            dto.setTerminees(terminees != null ? terminees : 0L);
            
            // Conversion heures → minutes (ou garder en heures selon votre besoin)
            dto.setTempsMoyen(tempsMoyenHeures != null ? Math.round(tempsMoyenHeures * 60) : 0.0);

            // 🔥 Statut occupé basé sur les PANNES avec statut_interventions EN_COURS
            dto.setOccupe(
                    panneRepository.existsByTechnicienIdAndStatutInterventions(
                            technicien.getId(),
                            StatutInterventions.EN_COURS
                    )
            );

            return dto;
        }).toList();
    }
}