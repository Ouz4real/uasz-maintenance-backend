package sn.uasz.uasz_maintenance_backend.dtos;

import lombok.*;

import java.time.LocalDate;
import java.util.List;

@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @Builder
public class EquipementDetailsDto {

    private Long typeId;
    private String type;                 // libelle

    private String description;          // ✅ ajouté
    private LocalDate dateAcquisition;   // ✅ ajouté

    private long total;
    private long enService;
    private long horsService;

    // ✅ liste des exemplaires EN_SERVICE (localisation + date)
    private List<EquipementItemDto> enServiceItems;
}
