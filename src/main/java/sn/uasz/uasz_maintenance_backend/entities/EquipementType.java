package sn.uasz.uasz_maintenance_backend.entities;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "equipement_types")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @Builder
public class EquipementType {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 150)
    private String libelle;

    @Column(length = 255)
    private String description;

    @Column(name = "date_acquisition")
    private LocalDate dateAcquisition;

    @JsonIgnore // ✅ on ne renvoie pas items directement (on passera par DTO)
    @OneToMany(mappedBy = "type", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<EquipementItem> items = new ArrayList<>();
}
