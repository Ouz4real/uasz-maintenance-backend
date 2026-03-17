package sn.uasz.uasz_maintenance_backend.repositories;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import sn.uasz.uasz_maintenance_backend.entities.Notification;

import java.util.List;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, Long> {
    
    List<Notification> findByUtilisateurIdOrderByDateCreationDesc(Long utilisateurId);
    
    @Query("SELECT n FROM Notification n WHERE n.utilisateurId = :userId AND n.lu = false ORDER BY n.dateCreation DESC")
    List<Notification> findUnreadByUserId(@Param("userId") Long userId);
    
    @Query("SELECT COUNT(n) FROM Notification n WHERE n.utilisateurId = :userId AND n.lu = false")
    Long countUnreadByUserId(@Param("userId") Long userId);
    
    List<Notification> findTop10ByUtilisateurIdOrderByDateCreationDesc(Long utilisateurId);

    @Modifying
    @Query("DELETE FROM Notification n WHERE n.utilisateurId = :userId")
    void deleteByUtilisateurId(@Param("userId") Long userId);
}
