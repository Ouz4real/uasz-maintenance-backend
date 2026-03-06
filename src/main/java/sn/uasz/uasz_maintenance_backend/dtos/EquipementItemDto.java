package sn.uasz.uasz_maintenance_backend.dtos;

import lombok.*;

import java.time.LocalDate;

@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @Builder
public class EquipementItemDto {
    private Long id;
    private String statut;       // EN_SERVICE / HORS_SERVICE
    private String localisation;
    private LocalDate dateMiseEnService;
    private Long interventionId; // nullable

}
