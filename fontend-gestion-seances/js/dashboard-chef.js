/**
 * Dashboard Chef - Logic
 */

// Vérifier l'authentification au chargement
console.log('USER CONNECTÉ :', user);

document.addEventListener('DOMContentLoaded', async () => {
    const user = requireAuth();

    if (!user) return;

    // Vérifier le rôle
    if (user.role !== 'CHEF_DEPARTEMENT') {
        alert('Accès non autorisé');
        logout();
        return;
    }

    // Afficher info utilisateur
    const userName = document.getElementById('userName');
    if (userName && user.email) {
        userName.textContent = user.email.split('@')[0];
    }

    // Charger les données
    await loadDashboardData();
});

/**
 * Charger toutes les données du dashboard
 */
async function loadDashboardData() {
    try {
        // Charger en parallèle
        await Promise.all([
            loadStats(),
            loadProchainesSeances(),
            loadOccupationSalles()
        ]);
    } catch (error) {
        console.error('Erreur chargement dashboard:', error);
    }
}

/**
 * Charger les statistiques
 */
async function loadStats() {
    try {
        const [seances, users, salles] = await Promise.all([
            API.seances.getAll(),
            API.users.getAll(),
            API.salles.getAll()
        ]);

        // Filtrer les séances de cette semaine
        const today = new Date();
        const weekStart = new Date(today);
        weekStart.setDate(today.getDate() - today.getDay());
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 7);

        const seancesSemaine = seances.filter(s => {
            const seanceDate = new Date(s.date);
            return seanceDate >= weekStart && seanceDate <= weekEnd;
        });

        // Compter les enseignants
        const enseignants = users.filter(u => u.role === 'ENSEIGNANT');

        // Mettre à jour les stats
        updateStat('totalSeances', seancesSemaine.length);
        updateStat('totalEnseignants', enseignants.length);
        updateStat('totalSalles', salles.length);

        // Détection des conflits (simple scan)
        let conflitsCount = 0;
        for (let i = 0; i < seances.length; i++) {
            for (let j = i + 1; j < seances.length; j++) {
                const s1 = seances[i];
                const s2 = seances[j];

                // Même jour
                if (s1.date !== s2.date) continue;

                // Chevauchement horaire
                const overlap = s1.heure_debut < s2.heure_fin && s1.heure_fin > s2.heure_debut;
                if (!overlap) continue;

                // Conflit si même salle ou même enseignant
                if (s1.salle_id === s2.salle_id || s1.enseignant_id === s2.enseignant_id) {
                    conflitsCount++;
                }
            }
        }
        updateStat('conflitsDetectes', conflitsCount);

    } catch (error) {
        console.error('Erreur chargement stats:', error);
        updateStat('totalSeances', '--');
        updateStat('totalEnseignants', '--');
        updateStat('totalSalles', '--');
        updateStat('conflitsDetectes', '--');
    }
}

/**
 * Mettre à jour une stat
 */
function updateStat(id, value) {
    const element = document.getElementById(id);
    if (element) {
        element.textContent = value;

        // Animation
        element.style.opacity = '0';
        setTimeout(() => {
            element.style.transition = 'opacity 0.3s ease';
            element.style.opacity = '1';
        }, 50);
    }
}

/**
 * Charger les prochaines séances
 */
async function loadProchainesSeances() {
    const container = document.getElementById('prochaines-seances');
    if (!container) return;

    try {
        const seances = await API.seances.getAll();

        // Filtrer et trier les prochaines séances
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const prochaines = seances
            .filter(s => {
                const seanceDate = new Date(s.date);
                return seanceDate >= today;
            })
            .sort((a, b) => {
                const dateA = new Date(a.date + ' ' + a.heure_debut);
                const dateB = new Date(b.date + ' ' + b.heure_debut);
                return dateA - dateB;
            })
            .slice(0, 5);

        if (prochaines.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <rect x="3" y="4" width="18" height="18" rx="2"/>
                        <line x1="16" y1="2" x2="16" y2="6"/>
                        <line x1="8" y1="2" x2="8" y2="6"/>
                        <line x1="3" y1="10" x2="21" y2="10"/>
                    </svg>
                    <h3>Aucune séance</h3>
                    <p>Aucune séance planifiée prochainement</p>
                </div>
            `;
            return;
        }

        container.innerHTML = prochaines.map(seance => `
            <div class="seance-item">
                <div class="seance-header">
                    <div class="seance-title">${seance.type} - ${seance.groupe || 'Groupe non spécifié'}</div>
                    <span class="seance-badge ${seance.type.toLowerCase()}">${seance.type}</span>
                </div>
                <div class="seance-details">
                    <div class="seance-detail">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                            <rect x="3" y="4" width="18" height="18" rx="2"/>
                            <line x1="16" y1="2" x2="16" y2="6" stroke="currentColor"/>
                            <line x1="8" y1="2" x2="8" y2="6" stroke="currentColor"/>
                        </svg>
                        <span>${formatDate(seance.date)}</span>
                    </div>
                    <div class="seance-detail">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                            <circle cx="12" cy="12" r="10"/>
                            <polyline points="12 6 12 12 16 14" stroke="white" stroke-width="2"/>
                        </svg>
                        <span>${seance.heure_debut} - ${seance.heure_fin}</span>
                    </div>
                    <div class="seance-detail">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                        </svg>
                        <span>${seance.salle_nom || 'Salle ' + seance.salle_id}</span>
                    </div>
                    <div class="seance-detail">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                            <circle cx="12" cy="12" r="10"/>
                            <path d="M12 6v6l4 2" stroke="white" stroke-width="2"/>
                        </svg>
                        <span>${seance.enseignant_nom || 'Enseignant'}</span>
                    </div>
                </div>
            </div>
        `).join('');

    } catch (error) {
        container.innerHTML = `
            <div class="empty-state">
                <p style="color: #c53030;">Erreur de chargement des séances</p>
            </div>
        `;
        console.error('Erreur chargement séances:', error);
    }
}

/**
 * Charger l'occupation des salles
 */
async function loadOccupationSalles() {
    const container = document.getElementById('occupation-salles');
    if (!container) return;

    try {
        const [salles, seances] = await Promise.all([
            API.salles.getAll(),
            API.seances.getAll()
        ]);

        // Calculer l'occupation pour aujourd'hui
        const today = new Date().toISOString().split('T')[0];
        const seancesToday = seances.filter(s => s.date === today);

        const occupations = salles.map(salle => {
            const seancesSalle = seancesToday.filter(s => s.salle_id === salle.id);
            const totalHeures = 10; // Journée de 8h à 18h
            const heuresOccupees = seancesSalle.reduce((acc, s) => {
                const debut = parseTime(s.heure_debut);
                const fin = parseTime(s.heure_fin);
                return acc + (fin - debut);
            }, 0);

            return {
                nom: salle.nom,
                occupation: Math.min(Math.round((heuresOccupees / totalHeures) * 100), 100)
            };
        });

        if (occupations.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <p>Aucune salle enregistrée</p>
                </div>
            `;
            return;
        }

        container.innerHTML = occupations.map(occ => `
            <div class="occupation-item">
                <div class="occupation-header">
                    <span class="occupation-name">${occ.nom}</span>
                    <span class="occupation-percent">${occ.occupation}%</span>
                </div>
                <div class="occupation-bar">
                    <div class="occupation-fill" style="width: ${occ.occupation}%"></div>
                </div>
            </div>
        `).join('');

    } catch (error) {
        container.innerHTML = `
            <div class="empty-state">
                <p style="color: #c53030;">Erreur de chargement</p>
            </div>
        `;
        console.error('Erreur chargement occupation:', error);
    }
}

/**
 * Utilitaires
 */

function formatDate(dateString) {
    const date = new Date(dateString);
    const options = { weekday: 'short', day: 'numeric', month: 'short' };
    return date.toLocaleDateString('fr-FR', options);
}

function parseTime(timeString) {
    const [hours, minutes] = timeString.split(':').map(Number);
    return hours + minutes / 60;
}
