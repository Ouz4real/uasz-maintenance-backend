package sn.uasz.uasz_maintenance_backend.dtos;

import lombok.*;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TerminerInterventionRequest {
    
    private String noteTechnicien;
    
    private List<PieceUtilisee> pieces;
    
    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class PieceUtilisee {
        private String nom;
        private Integer quantite;
    }
}
