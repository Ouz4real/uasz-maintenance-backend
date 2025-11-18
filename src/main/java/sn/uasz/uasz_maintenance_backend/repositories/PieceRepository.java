package sn.uasz.uasz_maintenance_backend.repositories;

import org.springframework.data.jpa.repository.JpaRepository;
import sn.uasz.uasz_maintenance_backend.entities.Piece;

import java.util.List;
import java.util.Optional;

public interface PieceRepository extends JpaRepository<Piece, Long> {

    Optional<Piece> findByCode(String code);

    boolean existsByCode(String code);

    // toutes les pièces actives
    List<Piece> findByActifTrue();

    // pièces dont le stock actuel est <= stock minimum
    List<Piece> findByStockActuelLessThanEqual(Integer stockActuel);
}
