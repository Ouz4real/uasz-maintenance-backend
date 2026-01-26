package sn.uasz.uasz_maintenance_backend.dtos;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class TechnicienUIResponse {

    private Long id;
    private String nom;
    private String prenom;
    private boolean occupe; // 🔥 calculé
}
