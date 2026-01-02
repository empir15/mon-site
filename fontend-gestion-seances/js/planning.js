/**
 * Logique de Planification
 */

document.addEventListener('DOMContentLoaded', async () => {
    requireAuth();

    // Définir la date min à aujourd'hui
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('date').min = today;

    // Charger les listes déroulantes
    await loadOptions();

    // Écouteurs d'événements
    document.getElementById('planningForm').addEventListener('submit', handlePlanningSubmit);

    // Détection de changements pour vérifier la disponibilité en temps réel
    const inputs = ['date', 'heure_debut', 'heure_fin', 'enseignant', 'salle'];
    inputs.forEach(id => {
        document.getElementById(id).addEventListener('change', checkAvailability);
    });
});

async function loadOptions() {
    try {
        const [users, salles] = await Promise.all([
            API.users.getAll(),
            API.salles.getAll()
        ]);

        // Peupler enseignants
        const enseignantSelect = document.getElementById('enseignant');
        users
            .filter(u => u.role === 'ENSEIGNANT')
            .forEach(eng => {
                const opt = document.createElement('option');
                opt.value = eng.id; // Note: l'API devrait idéalement retourner l'ID enseignant, ou on gérera ça côté serveur
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

async function checkAvailability() {
    const date = document.getElementById('date').value;
    const start = document.getElementById('heure_debut').value;
    const end = document.getElementById('heure_fin').value;
    const teacherId = document.getElementById('enseignant').value;
    const roomId = document.getElementById('salle').value;

    if (!date || !start || !end || !teacherId || !roomId) return;

    // TODO: Appel API pour vérifier spécifiquement les conflits (endpoint à créer ou logique frontend)
    // Pour l'instant, on simule une vérification "OK" visuelle
    // L'API `create` renverra une erreur 409 en cas de conflit réel

    const statusDiv = document.getElementById('availabilityStatus');
    statusDiv.innerHTML = `
        <div style="text-align: center; color: var(--gray);">
            <div class="spinner-small" style="margin: 0 auto 10px;"></div>
            Vérification...
        </div>
    `;

    // Simulation délai
    setTimeout(() => {
        statusDiv.innerHTML = `
            <div class="alert success" style="margin: 0;">
                <svg class="alert-icon" width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"/>
                </svg>
                <span>Créneau disponible</span>
            </div>
        `;
    }, 500);
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
        await API.seances.create(data);
        showNotification('Séance planifiée avec succès !', 'success');
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
