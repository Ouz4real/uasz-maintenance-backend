-- Script pour réinitialiser le mot de passe du superviseur à "super123"
-- Hash BCrypt de "super123": $2a$10$xQVVqZ9YxZ9YxZ9YxZ9YxOqZ9YxZ9YxZ9YxZ9YxZ9YxZ9YxZ9YxZ9Y

-- Mettre à jour le mot de passe du superviseur
UPDATE utilisateur 
SET mot_de_passe = '$2a$10$N9qo8uLOickgx2ZMRZoMye1J8qYqYqYqYqYqYqYqYqYqYqYqYqYqY'
WHERE username = 'superviseur';

-- Vérifier la mise à jour
SELECT id, username, email, role, enabled 
FROM utilisateur 
WHERE username = 'superviseur';

-- Note: Le hash ci-dessus est un exemple. Pour générer le vrai hash, utilisez:
-- Java: BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();
--       String hash = encoder.encode("super123");
