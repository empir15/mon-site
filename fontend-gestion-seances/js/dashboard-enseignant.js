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

    document.getElementById('userName').textContent = user.nom || user.email;
    document.getElementById('headerUserName').textContent = user.nom;

    // Date
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    document.getElementById('currentDateDisplay').textContent = new Date().toLocaleDateString('fr-FR', options);

    await loadTeacherData(user);
});

async function loadTeacherData(user) {
    try {
        // 1. Récupérer l'ID enseignant
        // On charge tous les utilisateurs pour trouver la correspondance (solution temporaire faute d'endpoint /me)
        const [users, seances, salles] = await Promise.all([
            API.users.getAll(),
            API.seances.getAll(),
            API.salles.getAll()
        ]);

        // Trouver mon profil enseignant
        // Note: L'API users.getAll retourne la table utilisateur. 
        // On a besoin de savoir quel est mon ID dans la table 'enseignant' ou si l'API user retourne déjà ça.
        // Si l'API backend est bien faite, elle joint les tables.
        // Supposons que nous devons filtrer les séances où enseignant_id correspond.
        // Problème : on a besoin de l'ID de la table 'enseignant'.

        // Comme nous n'avons pas d'endpoint facile pour "mon profit enseignant", 
        // nous allons ruser : filtrer les séances où le NOM de l'enseignant correspond à mon nom.
        // C'est fragile mais ça marche pour le prototype si les noms sont uniques.

        // Meilleure approche : filtrer par utilisateur_id si disponible, sinon nom.

        // Filtrons les séances pour cet enseignant
        // L'objet seance contient 'enseignant_nom' (jointure backend).
        const mySeances = seances.filter(s => s.enseignant_nom === user.nom);

        calculateStats(mySeances);
        displaySessions(mySeances, salles);

    } catch (error) {
        console.error('Erreur chargement:', error);
        document.getElementById('todaysSessions').innerHTML = '<p class="error-msg">Erreur de chargement des données.</p>';
    }
}

function calculateStats(seances) {
    // Heures cette semaine
    const now = new Date();
    const startOfWeek = new Date(now);
    const day = startOfWeek.getDay() || 7;
    startOfWeek.setHours(-24 * (day - 1)); // Lundi

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(endOfWeek.getDate() + 7);

    let hours = 0;

    // Prochain cours
    let nextCourse = null;
    let minDiff = Infinity;

    seances.forEach(s => {
        const date = new Date(s.date);

        // Heures semaine
        if (date >= startOfWeek && date < endOfWeek) {
            const [h1, m1] = s.heure_debut.split(':').map(Number);
            const [h2, m2] = s.heure_fin.split(':').map(Number);
            hours += (h2 + m2 / 60) - (h1 + m1 / 60);
        }

        // Prochain cours (date future la plus proche)
        const seanceStart = new Date(`${s.date}T${s.heure_debut}`);
        const diff = seanceStart - now;

        if (diff > 0 && diff < minDiff) {
            minDiff = diff;
            nextCourse = s;
        }
    });

    document.getElementById('hoursThisWeek').textContent = Math.round(hours) + 'h';

    if (nextCourse) {
        const isToday = new Date(nextCourse.date).toDateString() === now.toDateString();
        const dayStr = isToday ? 'Aujourd\'hui' : new Date(nextCourse.date).toLocaleDateString('fr-FR', { weekday: 'short' });
        document.getElementById('nextCourseTime').innerHTML = `
            ${dayStr} <br>
            <span style="font-size:0.8em">${nextCourse.heure_debut} - ${nextCourse.salle_nom || '?'}</span>
        `;
    } else {
        document.getElementById('nextCourseTime').textContent = "Aucun";
    }
}

function displaySessions(seances, salles) {
    const today = new Date().toISOString().split('T')[0];

    const tomorrowDate = new Date();
    tomorrowDate.setDate(tomorrowDate.getDate() + 1);
    const tomorrow = tomorrowDate.toISOString().split('T')[0];

    const todaySessions = seances
        .filter(s => s.date === today)
        .sort((a, b) => a.heure_debut.localeCompare(b.heure_debut));

    const tomorrowSessions = seances
        .filter(s => s.date === tomorrow)
        .sort((a, b) => a.heure_debut.localeCompare(b.heure_debut));

    renderList('todaysSessions', todaySessions);
    renderList('tomorrowsSessions', tomorrowSessions);
}

function renderList(containerId, list) {
    const container = document.getElementById(containerId);

    if (list.length === 0) {
        container.innerHTML = `
            <div class="card">
                <div class="card-body" style="color: var(--gray); font-style: italic;">
                    Aucun cours prévu.
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
                        ${s.salle_nom || 'Salle inconnue'}
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
