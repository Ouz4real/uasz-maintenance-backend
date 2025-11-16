package sn.uasz.uasz_maintenance_backend.entities;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;

@Entity
@Table(name = "equipements")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Equipement {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 50)
    private String code;        // ex : EQ-0001

    @Column(nullable = false, length = 150)
    private String libelle;     // ex : Vidéoprojecteur amphi A

    @Column(length = 255)
    private String description;

    @Column(name = "date_acquisition")
    private LocalDate dateAcquisition;

    @Column(length = 50)
    private String etat;        // ex : EN_SERVICE, EN_PANNE, HORS_SERVICE

    @Column(length = 100)
    private String localisation; // ex : Amphi A, Salle info 2
}
