/**
 * Logique Emploi du Temps Enseignant
 */

let currentDate = new Date();
let mySeances = [];
const DAYS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
const HOURS = Array.from({ length: 11 }, (_, i) => i + 8); // 8h à 18h

document.addEventListener('DOMContentLoaded', async () => {
    const user = requireAuth();
    if (!user || user.role !== 'ENSEIGNANT') return;

    await loadData(user);
    renderCalendar();
});

async function loadData(user) {
    try {
        const seances = await API.seances.getAll();
        mySeances = seances.filter(s => s.enseignant_nom === user.nom);
    } catch (error) {
        console.error('Erreur chargement:', error);
    }
}

function changeWeek(offset) {
    currentDate.setDate(currentDate.getDate() + (offset * 7));
    renderCalendar();
}

function resetToToday() {
    currentDate = new Date();
    renderCalendar();
}

function renderCalendar() {
    const timetable = document.getElementById('timetable');
    timetable.innerHTML = '';

    // Début semaine
    const startOfWeek = new Date(currentDate);
    const day = startOfWeek.getDay() || 7;
    if (day !== 1) startOfWeek.setHours(-24 * (day - 1));

    // Header Semaine
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(endOfWeek.getDate() + 6);
    document.getElementById('currentWeekRange').textContent =
        `${formatDateShort(startOfWeek)} - ${formatDateShort(endOfWeek)}`;

    // Structure Grille
    timetable.appendChild(createCell('time-col', ''));
    DAYS.forEach((d, i) => {
        const date = new Date(startOfWeek);
        date.setDate(date.getDate() + i);
        const cell = createCell('day-header', `${d} ${date.getDate()}`);
        if (isSameDay(date, new Date())) cell.style.color = 'var(--primary)';
        timetable.appendChild(cell);
    });

    const timeColumn = document.createElement('div');
    HOURS.forEach(h => {
        timeColumn.appendChild(createCell('time-col', `${h}h00`));
    });
    timetable.appendChild(timeColumn);

    DAYS.forEach((_, dayIndex) => {
        const dayCol = document.createElement('div');
        dayCol.className = 'day-col';

        HOURS.forEach((h, i) => {
            const line = document.createElement('div');
            line.className = 'hour-lines';
            line.style.top = `${i * 60}px`; // Supposons 60px par heure
            dayCol.appendChild(line);
        });

        // Placer les séances
        const currentDayDate = new Date(startOfWeek);
        currentDayDate.setDate(currentDayDate.getDate() + dayIndex);
        const dateStr = currentDayDate.toISOString().split('T')[0];

        const daySeances = mySeances.filter(s => s.date === dateStr);

        daySeances.forEach(seance => {
            const [startH, startM] = seance.heure_debut.split(':').map(Number);
            const [endH, endM] = seance.heure_fin.split(':').map(Number);

            const startDec = startH + startM / 60;
            const endDec = endH + endM / 60;

            // Hauteur cellule heure supposée à ~53px (padding+border) dans CSS original
            // Ajustement basique : 60px par heure
            const top = (startDec - 8) * 60;
            const height = (endDec - startDec) * 60;

            const el = document.createElement('div');
            el.className = `seance-block type-${seance.type.toLowerCase()}`;
            el.style.top = `${top}px`;
            el.style.height = `${height}px`;
            el.innerHTML = `<strong>${seance.type}</strong><br>${seance.groupe}<br><small>${seance.salle_nom || ''}</small>`;
            el.onclick = () => window.location.href = `detail-seance.html?id=${seance.id}`;

            dayCol.appendChild(el);
        });

        timetable.appendChild(dayCol);
    });
}

function createCell(className, text) {
    const div = document.createElement('div');
    div.className = className;
    div.textContent = text;
    // Si c'est une cellule d'heure, fixer la hauteur
    if (className === 'time-col' && text !== '') div.style.height = '60px';
    return div;
}

function isSameDay(d1, d2) {
    return d1.toDateString() === d2.toDateString();
}

function formatDateShort(date) {
    return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
}
