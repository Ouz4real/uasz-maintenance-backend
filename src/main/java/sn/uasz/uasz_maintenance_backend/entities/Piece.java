package sn.uasz.uasz_maintenance_backend.entities;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;

@Entity
@Table(name = "pieces")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Piece {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 50)
    private String code;

    @Column(nullable = false, length = 150)
    private String libelle;

    @Column(length = 500)
    private String description;

    @Column(nullable = false)
    private Integer stockActuel;

    @Column(nullable = false)
    private Integer stockMinimum;

    // 🔥 NOUVEAU — champ déjà présent dans ta base SQL
    @Column(nullable = true)
    private Integer seuilAlerte;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal prixUnitaire;

    /**
     * Indique si la pièce est active (visible dans les listes, disponible pour les interventions).
     */
    @Builder.Default
    @Column(nullable = false)
    private Boolean actif = true;
}
