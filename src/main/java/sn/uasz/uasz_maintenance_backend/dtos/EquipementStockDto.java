package sn.uasz.uasz_maintenance_backend.dtos;

import lombok.*;

@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @Builder
public class EquipementStockDto {
    private Long typeId;
    private String type;     // libelle
    private long total;
}
