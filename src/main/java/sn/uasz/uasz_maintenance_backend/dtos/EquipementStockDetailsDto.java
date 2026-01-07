package sn.uasz.uasz_maintenance_backend.dtos;

import lombok.*;

import java.time.LocalDate;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EquipementStockDetailsDto {
    private Long typeId;
    private String type;
    private String description;
    private LocalDate dateAcquisition;

    private long quantiteTotale;
    private long enService;
    private long horsService;

    private List<EquipementItemDto> items; // pour afficher dans la modale
}
