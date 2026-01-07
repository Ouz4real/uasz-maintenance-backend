package sn.uasz.uasz_maintenance_backend.entities;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;
import sn.uasz.uasz_maintenance_backend.enums.EtatEquipementItem;

import java.time.LocalDate;

@Entity
@Table(name = "equipement_items")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @Builder
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class EquipementItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "type_id")
    private EquipementType type;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private EtatEquipementItem statut; // EN_SERVICE / HORS_SERVICE

    @Column(length = 100)
    private String localisation;

    @Column(name = "date_mise_en_service")
    private LocalDate dateMiseEnService;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "intervention_id")
    @JsonIgnoreProperties({"panne","taches","technicien"}) // évite sérialisation lourde / boucles
    private Intervention intervention; // nullable

}
