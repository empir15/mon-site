/**
 * Logique Détail Séance Enseignant
 */

let currentSeance = null;

document.addEventListener('DOMContentLoaded', async () => {
    requireAuth();

    const urlParams = new URLSearchParams(window.location.search);
    const id = urlParams.get('id');

    if (!id) {
        alert('Séance non spécifiée');
        window.location.href = 'dashboard.html';
        return;
    }

    await loadSeanceDetails(id);
});

async function loadSeanceDetails(id) {
    try {
        currentSeance = await API.seances.getById(id);

        // Remplir les champs
        document.getElementById('seanceType').textContent = currentSeance.type;
        document.getElementById('seanceGroupe').textContent = currentSeance.groupe;
        document.getElementById('seanceDate').textContent = new Date(currentSeance.date).toLocaleDateString('fr-FR', {
            weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
        });
        document.getElementById('seanceHoraire').textContent = `${currentSeance.heure_debut} - ${currentSeance.heure_fin}`;
        document.getElementById('seanceSalle').textContent = currentSeance.salle_nom || 'Non spécifiée';
        document.getElementById('seanceProf').textContent = currentSeance.enseignant_nom || 'Non spécifié';

        updateStatusUI(currentSeance.statut);

    } catch (error) {
        console.error('Erreur:', error);
        alert('Impossible de charger la séance');
    }
}

function updateStatusUI(statut) {
    const badge = document.getElementById('statusBadge');
    badge.textContent = statut;
    badge.className = `status-badge status-${statut.toLowerCase()}`;

    const actionArea = document.getElementById('actionArea');
    const doneArea = document.getElementById('doneArea');

    if (statut === 'EFFECTUEE') {
        actionArea.style.display = 'none';
        doneArea.style.display = 'block';
    } else {
        actionArea.style.display = 'block';
        doneArea.style.display = 'none';
    }
}

async function markAsDone() {
    if (!currentSeance) return;
    if (!confirm('Confirmer que cette séance a bien eu lieu ?')) return;

    try {
        // Mise à jour via API
        await API.seances.update(currentSeance.id, {
            ...currentSeance, // Garder les autres champs
            statut: 'EFFECTUEE'
        });

        currentSeance.statut = 'EFFECTUEE';
        updateStatusUI('EFFECTUEE');
        showNotification('Séance marquée comme effectuée !', 'success');

    } catch (error) {
        alert('Erreur lors de la mise à jour');
    }
}

async function saveNotes() {
    const notes = document.getElementById('cahierTexte').value;
    if (!notes) return;

    // Simulation sauvegarde (faute de champ 'notes' officiel dans le schéma actuel, on pourrait le stocker dans 'commentaire' ou ajouter un champ)
    alert('Notes enregistrées (Simulation)');
}

function showNotification(message, type) {
    // Réutilisation fonction notification (à centraliser idéalement)
    const n = document.createElement('div');
    n.className = `notification notification-${type}`;
    n.style.cssText = `position: fixed; top: 20px; right: 20px; padding: 1rem; background: #48bb78; color: white; border-radius: 8px; z-index: 9999;`;
    n.textContent = message;
    document.body.appendChild(n);
    setTimeout(() => n.remove(), 3000);
}
