package sn.uasz.uasz_maintenance_backend.services.impl;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import sn.uasz.uasz_maintenance_backend.dtos.EquipementItemDto;
import sn.uasz.uasz_maintenance_backend.dtos.EquipementStockDetailsDto;
import sn.uasz.uasz_maintenance_backend.dtos.EquipementStockRowDto;
import sn.uasz.uasz_maintenance_backend.entities.EquipementItem;
import sn.uasz.uasz_maintenance_backend.entities.EquipementType;
import sn.uasz.uasz_maintenance_backend.enums.EtatEquipementItem;
import sn.uasz.uasz_maintenance_backend.exceptions.ResourceNotFoundException;
import sn.uasz.uasz_maintenance_backend.repositories.EquipementItemRepository;
import sn.uasz.uasz_maintenance_backend.repositories.EquipementTypeRepository;
import sn.uasz.uasz_maintenance_backend.services.StockEquipementService;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class StockEquipementServiceImpl implements StockEquipementService {

    private final EquipementTypeRepository typeRepo;
    private final EquipementItemRepository itemRepo;

    @Override
    public List<EquipementStockRowDto> getStock() {
        List<EquipementType> types = typeRepo.findAll();

        return types.stream().map(t -> {
            Long typeId = t.getId();

            long total = itemRepo.countByTypeId(typeId);
            long enService = itemRepo.countByTypeIdAndStatut(typeId, EtatEquipementItem.EN_SERVICE);
            long horsService = itemRepo.countByTypeIdAndStatut(typeId, EtatEquipementItem.HORS_SERVICE);

            return EquipementStockRowDto.builder()
                    .typeId(typeId)
                    .type(t.getLibelle())
                    .quantiteTotale(total)
                    .enService(enService)
                    .horsService(horsService)
                    .build();
        }).toList();
    }

    @Override
    public EquipementStockDetailsDto getStockDetails(Long typeId) {
        EquipementType type = typeRepo.findById(typeId)
                .orElseThrow(() -> new ResourceNotFoundException("Type équipement introuvable id=" + typeId));

        long total = itemRepo.countByTypeId(typeId);
        long enService = itemRepo.countByTypeIdAndStatut(typeId, EtatEquipementItem.EN_SERVICE);
        long horsService = itemRepo.countByTypeIdAndStatut(typeId, EtatEquipementItem.HORS_SERVICE);

        List<EquipementItem> items = itemRepo.findByTypeIdOrderByIdDesc(typeId);

        List<EquipementItemDto> itemDtos = items.stream().map(i ->
                EquipementItemDto.builder()
                        .id(i.getId())
                        .statut(i.getStatut() != null ? i.getStatut().name() : null)
                        .localisation(i.getLocalisation())
                        .dateMiseEnService(i.getDateMiseEnService())
                        .build()
        ).toList();

        return EquipementStockDetailsDto.builder()
                .typeId(type.getId())
                .type(type.getLibelle())
                .description(type.getDescription())
                .dateAcquisition(type.getDateAcquisition())
                .quantiteTotale(total)
                .enService(enService)
                .horsService(horsService)
                .items(itemDtos)
                .build();
    }
}
