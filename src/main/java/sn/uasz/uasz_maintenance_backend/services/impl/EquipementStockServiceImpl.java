package sn.uasz.uasz_maintenance_backend.services.impl;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import sn.uasz.uasz_maintenance_backend.dtos.EquipementDetailsDto;
import sn.uasz.uasz_maintenance_backend.dtos.EquipementItemDto;
import sn.uasz.uasz_maintenance_backend.dtos.EquipementStockDto;
import sn.uasz.uasz_maintenance_backend.entities.EquipementItem;
import sn.uasz.uasz_maintenance_backend.entities.EquipementType;
import sn.uasz.uasz_maintenance_backend.enums.EtatEquipementItem;
import sn.uasz.uasz_maintenance_backend.exceptions.ResourceNotFoundException;
import sn.uasz.uasz_maintenance_backend.repositories.EquipementItemRepository;
import sn.uasz.uasz_maintenance_backend.repositories.EquipementTypeRepository;
import sn.uasz.uasz_maintenance_backend.services.EquipementStockService;

import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class EquipementStockServiceImpl implements EquipementStockService {

    private final EquipementTypeRepository typeRepo;
    private final EquipementItemRepository itemRepo;

    // ===============================
    // LISTE STOCK (Type + Quantité)
    // ===============================
    @Override
    @Transactional(readOnly = true)
    public List<EquipementStockDto> getStock() {
        return typeRepo.findAll().stream()
                .map(t -> EquipementStockDto.builder()
                        .typeId(t.getId())
                        .type(t.getLibelle())
                        .total(itemRepo.countByTypeId(t.getId()))
                        .build()
                )
                .toList();
    }

    // ===============================
    // DÉTAILS D’UN TYPE D’ÉQUIPEMENT
    // ===============================
    @Override
    @Transactional(readOnly = true)
    public EquipementDetailsDto getDetails(Long typeId) {

        EquipementType type = typeRepo.findById(typeId)
                .orElseThrow(() ->
                        new ResourceNotFoundException("Type équipement introuvable id=" + typeId)
                );

        long total = itemRepo.countByTypeId(typeId);
        long enService = itemRepo.countByTypeIdAndStatut(typeId, EtatEquipementItem.EN_SERVICE);
        long horsService = itemRepo.countByTypeIdAndStatut(typeId, EtatEquipementItem.HORS_SERVICE);

        List<EquipementItemDto> enServiceItems = itemRepo
                .findByTypeIdOrderByIdDesc(typeId)
                .stream()
                .filter(i -> i.getStatut() == EtatEquipementItem.EN_SERVICE)
                .map(i -> EquipementItemDto.builder()
                        .id(i.getId())
                        .statut(i.getStatut().name())
                        .localisation(i.getLocalisation())
                        .dateMiseEnService(i.getDateMiseEnService())
                        // ✅ NOUVEAU
                        .interventionId(i.getIntervention() != null ? i.getIntervention().getId() : null)
                        .build()
                )
                .toList();


        return EquipementDetailsDto.builder()
                .typeId(type.getId())
                .type(type.getLibelle())
                .description(type.getDescription())          // ✅ ajouté
                .dateAcquisition(type.getDateAcquisition())  // ✅ ajouté
                .total(total)
                .enService(enService)
                .horsService(horsService)
                .enServiceItems(enServiceItems)
                .build();
    }

    // ===============================
    // CRÉATION TYPE + QUANTITÉ
    // ===============================
    @Override
    public void createTypeWithQuantity(String libelle, String description, int quantite,
                                       String localisation, String statut) {

        EquipementType type = typeRepo.save(
                EquipementType.builder()
                        .libelle(libelle)
                        .description(description)
                        .dateAcquisition(LocalDate.now())
                        .build()
        );

        // ✅ Tous les nouveaux items => HORS_SERVICE / MAGASIN / dateMiseEnService null
        int q = Math.max(0, quantite);
        for (int i = 0; i < q; i++) {
            itemRepo.save(
                    EquipementItem.builder()
                            .type(type)
                            .statut(EtatEquipementItem.HORS_SERVICE)
                            .localisation("MAGASIN")
                            .dateMiseEnService(null)
                            .build()
            );
        }
    }

    // ===============================
    // AJOUT D’EXEMPLAIRES (plus tard)
    // ===============================
    @Override
    public void addItems(Long typeId, int quantite, String localisation, String statut) {

        EquipementType type = typeRepo.findById(typeId)
                .orElseThrow(() ->
                        new ResourceNotFoundException("Type équipement introuvable id=" + typeId)
                );

        EtatEquipementItem st =
                "HORS_SERVICE".equalsIgnoreCase(statut)
                        ? EtatEquipementItem.HORS_SERVICE
                        : EtatEquipementItem.EN_SERVICE;

        for (int i = 0; i < Math.max(0, quantite); i++) {
            itemRepo.save(
                    EquipementItem.builder()
                            .type(type)
                            .statut(st)
                            .localisation(localisation)
                            .dateMiseEnService(st == EtatEquipementItem.EN_SERVICE ? LocalDate.now() : null)
                            .build()
            );
        }
    }
}
