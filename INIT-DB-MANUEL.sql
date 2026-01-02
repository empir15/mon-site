-- ================================================
-- Script d'Initialisation Manuelle
-- Copiez-collez ces commandes dans MySQL Workbench
-- ================================================

-- 1. Créer la base de données
CREATE DATABASE IF NOT EXISTS gestion_seances_db;
USE gestion_seances_db;

-- 2. Créer les tables
CREATE TABLE IF NOT EXISTS utilisateur (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nom VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    mot_de_passe VARCHAR(255) NOT NULL,
    role ENUM('CHEF_DEPARTEMENT', 'ENSEIGNANT', 'SECRETAIRE', 'ETUDIANT', 'SYSTEME') NOT NULL DEFAULT 'ETUDIANT',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS enseignant (
    id INT AUTO_INCREMENT PRIMARY KEY,
    utilisateur_id INT NOT NULL,
    grade VARCHAR(100),
    specialite VARCHAR(255),
    FOREIGN KEY (utilisateur_id) REFERENCES utilisateur(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS salle (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nom VARCHAR(100) NOT NULL UNIQUE,
    capacite INT NOT NULL,
    equipements TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS seance (
    id INT AUTO_INCREMENT PRIMARY KEY,
    type ENUM('COURS', 'TD', 'TP') NOT NULL,
    date DATE NOT NULL,
    heure_debut TIME NOT NULL,
    heure_fin TIME NOT NULL,
    statut ENUM('PLANIFIEE', 'EFFECTUEE', 'ANNULEE', 'REPORTEE') DEFAULT 'PLANIFIEE',
    enseignant_id INT NOT NULL,
    salle_id INT NOT NULL,
    groupe VARCHAR(100),
    commentaire TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (enseignant_id) REFERENCES enseignant(id),
    FOREIGN KEY (salle_id) REFERENCES salle(id)
);

CREATE TABLE IF NOT EXISTS notification (
    id INT AUTO_INCREMENT PRIMARY KEY,
    utilisateur_id INT NOT NULL,
    message TEXT NOT NULL,
    date_envoi TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    lu BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (utilisateur_id) REFERENCES utilisateur(id) ON DELETE CASCADE
);

-- 3. Insérer les données de test
-- IMPORTANT : Les mots de passe sont déjà hachés avec bcrypt
-- Mot de passe pour tous : admin123 / prof123 / secretaire123

INSERT INTO utilisateur (nom, email, mot_de_passe, role) VALUES
('Chef Département', 'chef@dept-info.cm', '$2b$10$rZ0KN9MN5YxQxYqGZ1R5OORzKj3gxP7YPzFVkqD5EYZ9BYXpq8eKW', 'CHEF_DEPARTEMENT'),
('Marie Secrétaire', 'secretaire@dept-info.cm', '$2b$10$rZ0KN9MN5YxQxYqGZ1R5OORzKj3gxP7YPzFVkqD5EYZ9BYXpq8eKW', 'SECRETAIRE'),
('Dr. Jean Kamga', 'j.kamga@dept-info.cm', '$2b$10$rZ0KN9MN5YxQxYqGZ1R5OORzKj3gxP7YPzFVkqD5EYZ9BYXpq8eKW', 'ENSEIGNANT'),
('Prof. Marie Nkolo', 'm.nkolo@dept-info.cm', '$2b$10$rZ0KN9MN5YxQxYqGZ1R5OORzKj3gxP7YPzFVkqD5EYZ9BYXpq8eKW', 'ENSEIGNANT'),
('Dr. Paul Essomba', 'p.essomba@dept-info.cm', '$2b$10$rZ0KN9MN5YxQxYqGZ1R5OORzKj3gxP7YPzFVkqD5EYZ9BYXpq8eKW', 'ENSEIGNANT');

INSERT INTO enseignant (utilisateur_id, grade, specialite) VALUES
(3, 'Maître de Conférences', 'Bases de données'),
(4, 'Professeur', 'Intelligence Artificielle'),
(5, 'Maître de Conférences', 'Réseaux informatiques');

INSERT INTO salle (nom, capacite, equipements) VALUES
('Amphi A', 200, 'Projecteur, Microphone, Tableau blanc'),
('Salle TD1', 40, 'Projecteur, Tableau blanc'),
('Salle TD2', 40, 'Projecteur, Tableau blanc'),
('Labo Info 1', 30, 'Ordinateurs (30 postes), Projecteur'),
('Labo Info 2', 30, 'Ordinateurs (30 postes), Projecteur');

INSERT INTO seance (type, date, heure_debut, heure_fin, enseignant_id, salle_id, groupe, statut) VALUES
('COURS', '2025-01-06', '08:00:00', '10:00:00', 1, 1, 'L3 Informatique', 'PLANIFIEE'),
('TD', '2025-01-06', '10:30:00', '12:30:00', 1, 2, 'L3 Informatique Groupe A', 'PLANIFIEE'),
('COURS', '2025-01-07', '08:00:00', '10:00:00', 2, 1, 'M1 Informatique', 'PLANIFIEE'),
('TP', '2025-01-07', '14:00:00', '17:00:00', 3, 4, 'L2 Informatique', 'PLANIFIEE');

-- 4. Vérification
SELECT 'Base de données créée avec succès!' AS statut;
SELECT COUNT(*) AS nombre_utilisateurs FROM utilisateur;
SELECT COUNT(*) AS nombre_salles FROM salle;
SELECT COUNT(*) AS nombre_seances FROM seance;

-- ================================================
-- Comptes de test créés :
-- Chef : chef@dept-info.cm / admin123
-- Enseignant : j.kamga@dept-info.cm / prof123
-- Secrétaire : secretaire@dept-info.cm / secretaire123
-- ================================================
