-- Script pour créer des données initiales (seed)
USE gestion_seances_db;

-- Créer le compte Chef de Département par défaut
-- Mot de passe: admin123 (hashé avec bcrypt)
INSERT INTO utilisateur (nom, email, mot_de_passe, role) VALUES
('Chef Département', 'chef@dept-info.cm', '$2b$10$rZ0KN9MN5YxQxYqGZ1R5OORzKj3gxP7YPzFVkqD5EYZ9BYXpq8eKW', 'CHEF_DEPARTEMENT');

-- Créer une secrétaire
-- Mot de passe: secretaire123
INSERT INTO utilisateur (nom, email, mot_de_passe, role) VALUES
('Marie Secrétaire', 'secretaire@dept-info.cm', '$2b$10$rZ0KN9MN5YxQxYqGZ1R5OORzKj3gxP7YPzFVkqD5EYZ9BYXpq8eKW', 'SECRETAIRE');

-- Créer quelques enseignants
-- Mot de passe pour tous: prof123
INSERT INTO utilisateur (nom, email, mot_de_passe, role) VALUES
('Dr. Jean Kamga', 'j.kamga@dept-info.cm', '$2b$10$rZ0KN9MN5YxQxYqGZ1R5OORzKj3gxP7YPzFVkqD5EYZ9BYXpq8eKW', 'ENSEIGNANT'),
('Prof. Marie Nkolo', 'm.nkolo@dept-info.cm', '$2b$10$rZ0KN9MN5YxQxYqGZ1R5OORzKj3gxP7YPzFVkqD5EYZ9BYXpq8eKW', 'ENSEIGNANT'),
('Dr. Paul Essomba', 'p.essomba@dept-info.cm', '$2b$10$rZ0KN9MN5YxQxYqGZ1R5OORzKj3gxP7YPzFVkqD5EYZ9BYXpq8eKW', 'ENSEIGNANT');

-- Ajouter les détails des enseignants
INSERT INTO enseignant (utilisateur_id, grade, specialite) VALUES
(3, 'Maître de Conférences', 'Bases de données'),
(4, 'Professeur', 'Intelligence Artificielle'),
(5, 'Maître de Conférences', 'Réseaux informatiques');

-- Créer quelques salles
INSERT INTO salle (nom, capacite, equipements) VALUES
('Amphi A', 200, 'Projecteur, Microphone, Tableau blanc'),
('Salle TD1', 40, 'Projecteur, Tableau blanc'),
('Salle TD2', 40, 'Projecteur, Tableau blanc'),
('Labo Info 1', 30, 'Ordinateurs (30 postes), Projecteur'),
('Labo Info 2', 30, 'Ordinateurs (30 postes), Projecteur');

-- Créer quelques séances exemple
INSERT INTO seance (type, date, heure_debut, heure_fin, enseignant_id, salle_id, groupe, statut) VALUES
('COURS', '2025-01-06', '08:00:00', '10:00:00', 1, 1, 'L3 Informatique', 'PLANIFIEE'),
('TD', '2025-01-06', '10:30:00', '12:30:00', 1, 2, 'L3 Informatique Groupe A', 'PLANIFIEE'),
('COURS', '2025-01-07', '08:00:00', '10:00:00', 2, 1, 'M1 Informatique', 'PLANIFIEE'),
('TP', '2025-01-07', '14:00:00', '17:00:00', 3, 4, 'L2 Informatique', 'PLANIFIEE');
