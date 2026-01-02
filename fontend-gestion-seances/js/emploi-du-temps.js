/**
 * Logique de l'emploi du temps
 */

let currentDate = new Date();
let currentSeances = [];
let currentSeanceId = null;

const DAYS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
const HOURS = Array.from({ length: 11 }, (_, i) => i + 8); // 8h à 18h

document.addEventListener('DOMContentLoaded', async () => {
    requireAuth();

    setupFilters();
    await loadData();
    renderCalendar();
});

async function loadData() {
    try {
        const [seances, users, salles] = await Promise.all([
            API.seances.getAll(),
            API.users.getAll(),
            API.salles.getAll()
        ]);

        currentSeances = seances;

        // Peupler filtres
        const profSelect = document.getElementById('filterEnseignant');
        users.filter(u => u.role === 'ENSEIGNANT').forEach(p => {
            profSelect.innerHTML += `<option value="${p.id}">${escapeHtml(p.nom)}</option>`;
        });

        const salleSelect = document.getElementById('filterSalle');
        salles.forEach(s => {
            salleSelect.innerHTML += `<option value="${s.id}">${escapeHtml(s.nom)}</option>`;
        });

    } catch (error) {
        console.error('Erreur chargement:', error);
    }
}

function setupFilters() {
    ['filterEnseignant', 'filterSalle', 'filterNiveau'].forEach(id => {
        document.getElementById(id).addEventListener('change', renderCalendar);
    });
}

function changeWeek(offset) {
    currentDate.setDate(currentDate.getDate() + (offset * 7));
    renderCalendar();
}

function resetToToday() {
    currentDate = new Date();
    renderCalendar();
}

/**
 * Rendu du calendrier
 */
function renderCalendar() {
    const timetable = document.getElementById('timetable');
    timetable.innerHTML = '';

    // Calculer début de semaine (Lundi)
    const startOfWeek = new Date(currentDate);
    const day = startOfWeek.getDay() || 7; // Dimanche=7
    if (day !== 1) startOfWeek.setHours(-24 * (day - 1));

    // Afficher plage date
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(endOfWeek.getDate() + 6);
    document.getElementById('currentWeekRange').textContent =
        `${formatDateShort(startOfWeek)} - ${formatDateShort(endOfWeek)}`;

    // En-têtes (Coin vide + Jours)
    timetable.appendChild(createCell('time-col', ''));

    DAYS.forEach((d, i) => {
        const date = new Date(startOfWeek);
        date.setDate(date.getDate() + i);
        const isToday = isSameDay(date, new Date());

        const cell = createCell('day-header', `${d} ${date.getDate()}`);
        if (isToday) cell.style.color = 'var(--primary)';
        timetable.appendChild(cell);
    });

    // Colonne Heures
    const timeColumn = document.createElement('div');
    HOURS.forEach(h => {
        const cell = createCell('time-col', `${h}h00`);
        cell.style.height = '60px'; // 1h = 60px
        timeColumn.appendChild(cell);
    });
    timetable.appendChild(timeColumn);

    // Colonnes Jours (Contenu)
    DAYS.forEach((_, dayIndex) => {
        const dayCol = document.createElement('div');
        dayCol.className = 'day-col';

        // Lignes guides horaires
        HOURS.forEach((h, i) => {
            const line = document.createElement('div');
            line.className = 'hour-lines';
            line.style.top = `${i * 60}px`;
            dayCol.appendChild(line);
        });

        // Filtrer et placer les séances
        const currentDayDate = new Date(startOfWeek);
        currentDayDate.setDate(currentDayDate.getDate() + dayIndex);
        const dateStr = currentDayDate.toISOString().split('T')[0];

        const daySeances = filterSeances().filter(s => s.date === dateStr);

        daySeances.forEach(seance => {
            const [startH, startM] = seance.heure_debut.split(':').map(Number);
            const [endH, endM] = seance.heure_fin.split(':').map(Number);

            const startDecimal = startH + startM / 60;
            const endDecimal = endH + endM / 60;

            // Calcul position (8h = 0px)
            const top = (startDecimal - 8) * 60;
            const height = (endDecimal - startDecimal) * 60;

            const el = document.createElement('div');
            el.className = `seance-block type-${seance.type.toLowerCase()}`;
            el.style.top = `${top}px`;
            el.style.height = `${height}px`;
            el.textContent = `${seance.type} - ${seance.groupe}`;
            el.onclick = () => openSeanceModal(seance);

            // Ajouter infos info-bulle ou contenu supplémentaire si assez de place
            if (height > 40) {
                const sub = document.createElement('div');
                sub.style.fontSize = '0.7em';
                sub.style.opacity = '0.8';
                sub.textContent = `${seance.salle_nom || 'Salle ?'}`;
                el.appendChild(sub);
            }

            dayCol.appendChild(el);
        });

        timetable.appendChild(dayCol);
    });
}

function filterSeances() {
    const profId = document.getElementById('filterEnseignant').value;
    const salleId = document.getElementById('filterSalle').value;
    const niveau = document.getElementById('filterNiveau').value; // TODO: Filtrer sur le texte du groupe (contient "L3", etc.)

    return currentSeances.filter(s => {
        if (profId && s.enseignant_id != profId) return false;
        if (salleId && s.salle_id != salleId) return false;
        if (niveau && !s.groupe.includes(niveau)) return false;
        return true;
    });
}

function createCell(className, text) {
    const div = document.createElement('div');
    div.className = className;
    div.textContent = text;
    return div;
}

function isSameDay(d1, d2) {
    return d1.getDate() === d2.getDate() &&
        d1.getMonth() === d2.getMonth() &&
        d1.getFullYear() === d2.getFullYear();
}

function formatDateShort(date) {
    return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
}

/**
 * Gestion Modal
 */
function openSeanceModal(seance) {
    currentSeanceId = seance.id;
    const details = document.getElementById('seanceDetails');
    details.innerHTML = `
        <p><strong>Type:</strong> ${seance.type}</p>
        <p><strong>Groupe:</strong> ${escapeHtml(seance.groupe)}</p>
        <p><strong>Date:</strong> ${formatDateShort(new Date(seance.date))}</p>
        <p><strong>Horaire:</strong> ${seance.heure_debut} - ${seance.heure_fin}</p>
        <p><strong>Enseignant:</strong> ${seance.enseignant_nom || '?'}</p>
        <p><strong>Salle:</strong> ${seance.salle_nom || '?'}</p>
    `;
    document.getElementById('seanceModal').style.display = 'flex';
}

function closeSeanceModal() {
    document.getElementById('seanceModal').style.display = 'none';
    currentSeanceId = null;
}

async function deleteSeance() {
    if (!currentSeanceId) return;
    if (!confirm('Supprimer cette séance ?')) return;

    try {
        await API.seances.delete(currentSeanceId);
        closeSeanceModal();
        await loadData();
        renderCalendar();
    } catch (e) {
        alert('Erreur suppression');
    }
}

function escapeHtml(text) {
    return text ? text.replace(/</g, "&lt;") : '';
}
