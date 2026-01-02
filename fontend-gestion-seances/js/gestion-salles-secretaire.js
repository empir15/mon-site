/**
 * Logic Gestion Salles (Secrétaire)
 */

let salles = [];
let currentSalleId = null;

document.addEventListener('DOMContentLoaded', async () => {
    const user = requireAuth();
    if (!user || user.role !== 'SECRETAIRE') return;

    setupEventListeners();
    await loadSalles();
});

function setupEventListeners() {
    document.getElementById('searchInput').addEventListener('input', filterSalles);
    document.getElementById('salleForm').addEventListener('submit', handleSubmit);
}

async function loadSalles() {
    try {
        salles = await API.salles.getAll();
        displaySalles(salles);
    } catch (error) {
        console.error(error);
    }
}

function displaySalles(list) {
    const grid = document.getElementById('sallesGrid');
    if (list.length === 0) {
        grid.innerHTML = '<p class="text-gray">Aucune salle.</p>';
        return;
    }

    grid.innerHTML = list.map(s => `
        <div class="card">
            <div class="card-header">
                <div>
                    <h3 class="card-title">${escapeHtml(s.nom)}</h3>
                    <span class="text-sm text-gray">Cap: ${s.capacite}</span>
                </div>
                <div class="table-actions">
                    <!-- SEULEMENT EDIT -->
                    <button class="btn-icon edit" onclick='openEditSalleModal(${JSON.stringify(s)})'>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                        </svg>
                    </button>
                    <!-- Pas de bouton delete -->
                </div>
            </div>
            <div class="card-body">
                <p class="text-sm text-gray">${escapeHtml(s.equipements || 'Aucun équipement')}</p>
            </div>
        </div>
    `).join('');
}

function filterSalles() {
    const term = document.getElementById('searchInput').value.toLowerCase();
    const filtered = salles.filter(s => s.nom.toLowerCase().includes(term));
    displaySalles(filtered);
}

function openAddSalleModal() {
    currentSalleId = null;
    document.getElementById('modalTitle').textContent = 'Nouvelle Salle';
    document.getElementById('btnSubmitText').textContent = 'Créer';
    document.getElementById('salleForm').reset();
    document.getElementById('salleModal').style.display = 'flex';
}

function openEditSalleModal(s) {
    currentSalleId = s.id;
    document.getElementById('modalTitle').textContent = 'Modifier Salle';
    document.getElementById('btnSubmitText').textContent = 'Mettre à jour';
    document.getElementById('nom').value = s.nom;
    document.getElementById('capacite').value = s.capacite;
    document.getElementById('equipements').value = s.equipements || '';
    document.getElementById('salleModal').style.display = 'flex';
}

function closeSalleModal() {
    document.getElementById('salleModal').style.display = 'none';
}

async function handleSubmit(e) {
    e.preventDefault();
    const data = {
        nom: document.getElementById('nom').value,
        capacite: parseInt(document.getElementById('capacite').value),
        equipements: document.getElementById('equipements').value
    };

    try {
        if (currentSalleId) {
            await API.salles.update(currentSalleId, data);
        } else {
            await API.salles.create(data);
        }
        closeSalleModal();
        await loadSalles();
        alert('Opération réussie');
    } catch (e) {
        alert('Erreur: ' + e.message);
    }
}

function escapeHtml(text) { return text ? text.replace(/</g, "&lt;") : ''; }
