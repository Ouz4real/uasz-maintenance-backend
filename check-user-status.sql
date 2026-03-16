-- Vérifier le statut de l'utilisateur Aziz Ndoye
SELECT id, username, nom, prenom, email, role, enabled 
FROM utilisateurs 
WHERE username = 'zizcr7' OR nom = 'Ndoye';
