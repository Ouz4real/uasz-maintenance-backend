package sn.uasz.uasz_maintenance_backend.entities;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "intervention_pieces")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class InterventionPiece {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * Intervention concernée
     */
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "intervention_id", nullable = false)
    private Intervention intervention;

    /**
     * Pièce utilisée
     */
    @ManyToOne(fetch = FetchType.EAGER, optional = false)
    @JoinColumn(name = "piece_id", nullable = false)
    private Piece piece;

    /**
     * Quantité consommée pendant l'intervention
     */
    @Column(nullable = false)
    private Integer quantite;

    /**
     * Prix unitaire au moment de la consommation
     * (on le recopie depuis Piece.prixUnitaire pour garder l’historique)
     */
    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal prixUnitaire;

    /**
     * Coût total = quantite * prixUnitaire
     */
    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal coutTotal;

    /**
     * Date/heure de consommation de la pièce
     */
    @Column(nullable = false)
    private LocalDateTime dateUtilisation;
}
