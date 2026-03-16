package sn.uasz.uasz_maintenance_backend.dtos;

import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EquipementStockRowDto {
    private Long typeId;
    private String type;
    private long quantiteTotale;
    private long enService;
    private long horsService;
}
