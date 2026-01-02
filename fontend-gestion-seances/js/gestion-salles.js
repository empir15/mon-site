/**
 * Gestion des Salles - Logic
 */

let salles = [];
let currentSalleId = null;

// Initialisation
document.addEventListener('DOMContentLoaded', async () => {
    const user = requireAuth();
    if (!user || user.role !== 'CHEF_DEPARTEMENT') {
        alert('Accès non autorisé');
        logout();
        return;
    }

    setupEventListeners();
    await loadSalles();
});

function setupEventListeners() {
    // Recherche
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', filterSalles);
    }

    // Formulaire
    const salleForm = document.getElementById('salleForm');
    if (salleForm) {
        salleForm.addEventListener('submit', handleSubmit);
    }
}

/**
 * Charger les salles
 */
async function loadSalles() {
    const grid = document.getElementById('sallesGrid');
    if (!grid) return;

    try {
        salles = await API.salles.getAll();
        displaySalles(salles);
    } catch (error) {
        grid.innerHTML = `
            <div class="empty-state">
                <p style="color: #c53030;">Erreur de chargement des salles</p>
            </div>
        `;
        console.error('Erreur chargement salles:', error);
    }
}

/**
 * Afficher les salles
 */
function displaySalles(sallesToDisplay) {
    const grid = document.getElementById('sallesGrid');
    if (!grid) return;

    if (sallesToDisplay.length === 0) {
        grid.innerHTML = `
            <div class="empty-state">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                    <polyline points="9 22 9 12 15 12 15 22"/>
                </svg>
                <h3>Aucune salle</h3>
                <p>Commencez par ajouter une nouvelle salle</p>
            </div>
        `;
        return;
    }

    grid.innerHTML = sallesToDisplay.map(salle => `
        <div class="card">
            <div class="card-header">
                <div>
                    <h3 class="card-title">${escapeHtml(salle.nom)}</h3>
                    <span class="text-sm text-gray">Capacité: ${salle.capacite} places</span>
                </div>
                <div class="table-actions">
                    <button class="btn-icon edit" onclick='openEditSalleModal(${JSON.stringify(salle)})' title="Modifier">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                        </svg>
                    </button>
                    <button class="btn-icon delete" onclick="openDeleteModal(${salle.id}, '${escapeHtml(salle.nom)}')" title="Supprimer">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="3 6 5 6 21 6"/>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                        </svg>
                    </button>
                </div>
            </div>
            <div class="card-body">
                <div class="mb-4">
                    <h4 class="text-sm font-semibold mb-2">Équipements</h4>
                    <p class="text-sm text-gray">${salle.equipements ? escapeHtml(salle.equipements) : 'Aucun équipement spécifié'}</p>
                </div>
                <div class="capacity-info">
                    <div class="capacity-bar">
                        <div class="capacity-fill" style="width: 0%"></div>
                    </div>
                    <span class="capacity-text">0% occupé</span>
                </div>
            </div>
        </div>
    `).join('');
}

/**
 * Filtrer les salles
 */
function filterSalles() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const filtered = salles.filter(salle =>
        salle.nom.toLowerCase().includes(searchTerm) ||
        (salle.equipements && salle.equipements.toLowerCase().includes(searchTerm))
    );
    displaySalles(filtered);
}

/**
 * Modals
 */
function openAddSalleModal() {
    currentSalleId = null;
    document.getElementById('modalTitle').textContent = 'Nouvelle salle';
    document.getElementById('btnSubmitText').textContent = 'Créer la salle';
    document.getElementById('salleForm').reset();
    document.getElementById('salleModal').style.display = 'flex';
}

function openEditSalleModal(salle) {
    currentSalleId = salle.id;
    document.getElementById('modalTitle').textContent = 'Modifier la salle';
    document.getElementById('btnSubmitText').textContent = 'Mettre à jour';

    document.getElementById('nom').value = salle.nom;
    document.getElementById('capacite').value = salle.capacite;
    document.getElementById('equipements').value = salle.equipements || '';

    document.getElementById('salleModal').style.display = 'flex';
}

function closeSalleModal() {
    document.getElementById('salleModal').style.display = 'none';
    document.getElementById('salleForm').reset();
    currentSalleId = null;
}

/**
 * Soumission formulaire
 */
async function handleSubmit(e) {
    e.preventDefault();

    const formData = {
        nom: document.getElementById('nom').value,
        capacite: parseInt(document.getElementById('capacite').value),
        equipements: document.getElementById('equipements').value
    };

    try {
        if (currentSalleId) {
            await API.salles.update(currentSalleId, formData);
            showNotification('Salle mise à jour avec succès', 'success');
        } else {
            await API.salles.create(formData);
            showNotification('Salle créée avec succès', 'success');
        }
        closeSalleModal();
        await loadSalles();
    } catch (error) {
        showNotification(handleApiError(error), 'error');
    }
}

/**
 * Suppression
 */
function openDeleteModal(id, nom) {
    currentSalleId = id;
    document.getElementById('deleteSalleName').textContent = nom;
    document.getElementById('deleteModal').style.display = 'flex';
}

function closeDeleteModal() {
    document.getElementById('deleteModal').style.display = 'none';
    currentSalleId = null;
}

async function confirmDelete() {
    if (!currentSalleId) return;

    try {
        await API.salles.delete(currentSalleId);
        showNotification('Salle supprimée avec succès', 'success');
        closeDeleteModal();
        await loadSalles();
    } catch (error) {
        showNotification(handleApiError(error), 'error');
    }
}

// Utilitaires (si non présents dans auth.js)
function escapeHtml(text) {
    if (!text) return '';
    return text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.style.cssText = `
        position: fixed; top: 20px; right: 20px; padding: 1rem;
        background: ${type === 'success' ? '#48bb78' : '#f56565'};
        color: white; border-radius: 8px; z-index: 9999;
        box-shadow: 0 4px 6px rgba(0,0,0,0.1); animation: slideIn 0.3s ease;
    `;
    notification.textContent = message;
    document.body.appendChild(notification);
    setTimeout(() => {
        notification.remove();
    }, 3000);
}
