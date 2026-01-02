/**
 * Logique de Planification
 */

let isEditMode = false;
let editSeanceId = null;

document.addEventListener('DOMContentLoaded', async () => {
    requireAuth();

    // Gestion Mode Édition
    const params = new URLSearchParams(window.location.search);
    editSeanceId = params.get('id');
    isEditMode = !!editSeanceId;

    if (isEditMode) {
        document.querySelector('.page-title').textContent = 'Modifier la séance';
        document.querySelector('.page-subtitle').textContent = 'Mettre à jour les informations de la séance';
        document.querySelector('button[type="submit"]').textContent = 'Mettre à jour';
    } else {
        // Mode Création : Date min par défaut
        const today = new Date().toISOString().split('T')[0];
        document.getElementById('date').min = today;
    }

    // Charger les listes déroulantes (et les séances existantes pour conflits)
    await loadOptions();

    // Si édition, pré-remplir le formulaire
    if (isEditMode) {
        await loadSeanceData(editSeanceId);
    }

    // Écouteurs d'événements
    document.getElementById('planningForm').addEventListener('submit', handlePlanningSubmit);

    // Détection de changements pour vérifier la disponibilité en temps réel
    const inputs = ['date', 'heure_debut', 'heure_fin', 'enseignant', 'salle'];
    inputs.forEach(id => {
        document.getElementById(id).addEventListener('change', checkAvailability);
    });

    // Vérifier disponibilité initiale si édition
    if (isEditMode) {
        // Petit délai pour laisser le temps au DOM de se mettre à jour
        setTimeout(checkAvailability, 500);
    }
});

let existingSeances = [];

async function loadOptions() {
    try {
        const [users, salles, seances] = await Promise.all([
            API.users.getAll(),
            API.salles.getAll(),
            API.seances.getAll()
        ]);

        existingSeances = seances;

        // Peupler enseignants
        const enseignantSelect = document.getElementById('enseignant');
        users
            .filter(u => u.role === 'ENSEIGNANT')
            .forEach(eng => {
                const opt = document.createElement('option');
                opt.value = eng.id;
                opt.textContent = eng.nom;
                enseignantSelect.appendChild(opt);
            });

        // Peupler salles
        const salleSelect = document.getElementById('salle');
        salles.forEach(salle => {
            const opt = document.createElement('option');
            opt.value = salle.id;
            opt.textContent = `${salle.nom} (${salle.capacite} places)`;
            salleSelect.appendChild(opt);
        });

    } catch (error) {
        console.error('Erreur chargement options:', error);
        showNotification('Erreur de chargement des données', 'error');
    }
}

async function loadSeanceData(id) {
    try {
        // On cherche dans existingSeances qui est déjà chargé
        // ID est string dans URL mais peut etre number dans DB. Comparaison souple.
        const seance = existingSeances.find(s => s.id == id);

        if (!seance) {
            throw new Error('Séance non trouvée');
        }

        // Remplir le formulaire
        document.getElementById('date').value = seance.date;
        document.getElementById('heure_debut').value = seance.heure_debut;
        document.getElementById('heure_fin').value = seance.heure_fin;
        document.getElementById('groupe').value = seance.groupe;
        document.getElementById('enseignant').value = seance.enseignant_id;
        document.getElementById('salle').value = seance.salle_id;
        document.getElementById('commentaire').value = seance.commentaire || '';

        // Radio buttons
        const radio = document.querySelector(`input[name="type"][value="${seance.type}"]`);
        if (radio) radio.checked = true;

    } catch (error) {
        console.error('Erreur chargement séance:', error);
        showNotification('Impossible de charger la séance', 'error');
        setTimeout(() => window.location.href = 'emploi-du-temps.html', 2000);
    }
}

async function checkAvailability() {
    const date = document.getElementById('date').value;
    const start = document.getElementById('heure_debut').value;
    const end = document.getElementById('heure_fin').value;
    const teacherId = document.getElementById('enseignant').value;
    const roomId = document.getElementById('salle').value;

    const statusDiv = document.getElementById('availabilityStatus');

    if (!date || !start || !end) {
        statusDiv.innerHTML = `
            <div class="empty-state">
                <p>Remplissez la date et les heures pour vérifier</p>
            </div>
        `;
        return;
    }

    if (start >= end) {
        statusDiv.innerHTML = `
            <div class="alert negative" style="margin: 0; background: #fff5f5; border-color: #feb2b2; color: #c53030;">
                <span>L'heure de début doit être avant l'heure de fin</span>
            </div>
        `;
        return;
    }

    // Vérification des conflits
    const conflits = existingSeances.filter(s => {
        // En mode édition, s'exclure soi-même
        if (isEditMode && s.id == editSeanceId) return false;

        if (s.date !== date) return false;

        // Vérification Chevauchement Heures
        const overlap = start < s.heure_fin && end > s.heure_debut;
        if (!overlap) return false;

        const conflictSalle = roomId && s.salle_id == roomId;
        const conflictProf = teacherId && s.enseignant_id == teacherId;

        return conflictSalle || conflictProf;
    });

    if (conflits.length > 0) {
        const details = conflits.map(c => {
            const raison = c.salle_id == roomId ? `Salle ${c.salle_nom || 'occupée'}` : `Enseignant ${c.enseignant_nom || 'occupé'}`;
            return `${raison} (${c.heure_debut} - ${c.heure_fin})`;
        }).join(', ');

        statusDiv.innerHTML = `
            <div class="alert negative" style="margin: 0; background: #fff5f5; border-color: #feb2b2; color: #c53030;">
                 <svg class="alert-icon" width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"/>
                </svg>
                <span>Conflit détecté: ${details}</span>
            </div>
        `;
    } else {
        statusDiv.innerHTML = `
            <div class="alert success" style="margin: 0;">
                <svg class="alert-icon" width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"/>
                </svg>
                <span>Créneau disponible</span>
            </div>
        `;
    }
}

async function handlePlanningSubmit(e) {
    e.preventDefault();

    const data = {
        type: document.querySelector('input[name="type"]:checked').value,
        groupe: document.getElementById('groupe').value,
        date: document.getElementById('date').value,
        heure_debut: document.getElementById('heure_debut').value,
        heure_fin: document.getElementById('heure_fin').value,
        enseignant_id: document.getElementById('enseignant').value,
        salle_id: document.getElementById('salle').value,
        commentaire: document.getElementById('commentaire').value
    };

    try {
        if (isEditMode) {
            await API.seances.update(editSeanceId, data);
            showNotification('Séance mise à jour avec succès !', 'success');
        } else {
            await API.seances.create(data);
            showNotification('Séance planifiée avec succès !', 'success');
        }

        setTimeout(() => {
            window.location.href = 'emploi-du-temps.html';
        }, 1500);
    } catch (error) {
        const errorMsg = handleApiError(error);
        showNotification(errorMsg, 'error');

        // Afficher détails conflit
        const statusDiv = document.getElementById('availabilityStatus');
        statusDiv.innerHTML = `
            <div class="alert negative" style="margin: 0; background: #fff5f5; border-color: #feb2b2; color: #c53030;">
                 <svg class="alert-icon" width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"/>
                </svg>
                <span>${errorMsg}</span>
            </div>
        `;
    }
}

function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    // ... styles from other files ...
    notification.style.cssText = `
        position: fixed; top: 20px; right: 20px; padding: 1rem;
        background: ${type === 'success' ? '#48bb78' : '#f56565'};
        color: white; border-radius: 8px; z-index: 9999;
        box-shadow: 0 4px 6px rgba(0,0,0,0.1); animation: slideIn 0.3s ease;
    `;
    notification.textContent = message;
    document.body.appendChild(notification);
    setTimeout(() => notification.remove(), 4000);
}
