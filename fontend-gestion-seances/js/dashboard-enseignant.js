/**
 * Dashboard Enseignant Logic
 */

document.addEventListener('DOMContentLoaded', async () => {
    const user = requireAuth();
    if (!user || user.role !== 'ENSEIGNANT') {
        alert('Accès réservé aux enseignants');
        logout();
        return;
    }

    // Log pour debug
    console.log('USER CONNECTÉ (Enseignant) :', user);

    // Afficher nom utilisateur
    const userNameElem = document.getElementById('userName');
    const headerUserName = document.getElementById('headerUserName');
    if (userNameElem) userNameElem.textContent = user.nom || user.email;
    if (headerUserName) headerUserName.textContent = user.nom;

    // Date actuelle
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const currentDateDisplay = document.getElementById('currentDateDisplay');
    if (currentDateDisplay) {
        currentDateDisplay.textContent = new Date().toLocaleDateString('fr-FR', options);
    }

    await loadTeacherData(user);
});

async function loadTeacherData(user) {
    try {
        console.log('🔄 Chargement données enseignant:', user.email);

        // 1. Récupérer l'ID enseignant via users (jointure backend assumée)
        const [users, seances, salles] = await Promise.all([
            API.users.getAll(),
            API.seances.getAll(),
            API.salles.getAll()
        ]);

        // Trouver mon ID enseignant (via role + email/nom)
        const myUser = users.find(u => u.email === user.email && u.role === 'ENSEIGNANT');
        if (!myUser) {
            console.error('❌ Profil enseignant non trouvé pour:', user.email);
            showEmptyState('Aucun profil enseignant trouvé.');
            return;
        }

        // Trouver enseignant_id dans table enseignant (assume API.users inclut id_enseignant ou filtre par nom pour proto)
        // Note: Pour robustesse, ajoute un champ 'enseignant_id' dans user response backend si possible
        const myEnseignant = { id: myUser.id };  // Remplace par vraie jointure si backend joint
        // Filtre robuste par enseignant_id (ajuste si backend renvoie enseignant_id dans seances)
        const mySeances = seances.filter(s => s.enseignant_id === myEnseignant.id || s.enseignant_nom === user.nom);

        console.log('📊 Mes séances trouvées:', mySeances.length);

        // 2. Stats : Prochain cours
        const today = new Date().toISOString().split('T')[0];
        const todaySeances = mySeances.filter(s => s.date === today).sort((a, b) => a.heure_debut.localeCompare(b.heure_debut));
        const nextCourse = todaySeances[0];
        const nextTimeElem = document.getElementById('nextCourseTime');
        if (nextTimeElem) {
            nextTimeElem.textContent = nextCourse ? nextCourse.heure_debut.substring(0, 5) : '--:--';
        }

        // 3. Rendu listes
        renderList('todaysSessions', todaySeances);
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const tomorrowStr = tomorrow.toISOString().split('T')[0];
        const tomorrowSeances = mySeances.filter(s => s.date === tomorrowStr).sort((a, b) => a.heure_debut.localeCompare(b.heure_debut));
        renderList('tomorrowsSessions', tomorrowSeances);

    } catch (error) {
        console.error('❌ Erreur chargement enseignant:', error);
        showEmptyState('Erreur de chargement. Vérifiez votre connexion.');
    }
}

function renderList(containerId, list) {
    const container = document.getElementById(containerId);
    if (!container) return;

    if (list.length === 0) {
        container.innerHTML = `
            <div class="card">
                <div class="card-body" style="color: var(--gray); font-style: italic;">
                    Aucune séance prévue.
                </div>
            </div>`;
        return;
    }

    container.innerHTML = list.map(s => `
        <div class="card session-card border-left-${s.type.toLowerCase()}">
            <div class="session-time">
                <span class="start-time">${s.heure_debut.substring(0, 5)}</span>
                <span class="end-time">${s.heure_fin.substring(0, 5)}</span>
            </div>
            <div class="session-info">
                <h3 class="session-title">${s.type} - ${escapeHtml(s.groupe)}</h3>
                <div class="session-meta">
                    <span class="meta-item">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                        </svg>
                        ${escapeHtml(s.salle_nom || 'Salle inconnue')}
                    </span>
                    <span class="status-badge status-${s.statut.toLowerCase()}">
                        ${s.statut}
                    </span>
                </div>
            </div>
            <div class="session-action">
                <a href="detail-seance.html?id=${s.id}" class="btn btn-sm btn-outline">Détails</a>
            </div>
        </div>
    `).join('');
}

function escapeHtml(text) {
    return text ? text.replace(/</g, "&lt;") : '';
}

function showEmptyState(message) {
    const main = document.querySelector('main');
    if (main) {
        main.innerHTML = `<div class="empty-state"><p>${message}</p></div>`;
    }
}