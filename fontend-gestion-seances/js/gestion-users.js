/**
 * Gestion des Utilisateurs - Logic
 */

let users = [];
let currentUserId = null;

// Initialisation
document.addEventListener('DOMContentLoaded', async () => {
    const user = requireAuth();
    if (!user || user.role !== 'CHEF_DEPARTEMENT') {
        alert('Accès non autorisé');
        logout();
        return;
    }

    // Setup event listeners
    setupEventListeners();

    // Load users
    await loadUsers();
});

/**
 * Setup event listeners
 */
function setupEventListeners() {
    // Search
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', filterUsers);
    }

    // Filter role
    const filterRole = document.getElementById('filterRole');
    if (filterRole) {
        filterRole.addEventListener('change', filterUsers);
    }

    // Form submission
    const userForm = document.getElementById('userForm');
    if (userForm) {
        userForm.addEventListener('submit', handleSubmit);
    }
}

/**
 * Load all users
 */
async function loadUsers() {
    const tbody = document.getElementById('usersTableBody');
    if (!tbody) return;

    try {
        users = await API.users.getAll();
        displayUsers(users);
    } catch (error) {
        tbody.innerHTML = `
            <tr>
                <td colspan="5">
                    <div class="empty-state">
                        <p style="color: #c53030;">Erreur de chargement des utilisateurs</p>
                    </div>
                </td>
            </tr>
        `;
        console.error('Erreur chargement users:', error);
    }
}

/**
 * Display users in table
 */
function displayUsers(usersToDisplay) {
    const tbody = document.getElementById('usersTableBody');
    if (!tbody) return;

    if (usersToDisplay.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="5">
                    <div class="empty-state">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                            <circle cx="9" cy="7" r="4"/>
                        </svg>
                        <h3>Aucun utilisateur</h3>
                        <p>Commencez par créer un nouvel utilisateur</p>
                    </div>
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = usersToDisplay.map(user => `
        <tr>
            <td><strong>${escapeHtml(user.nom)}</strong></td>
            <td>${escapeHtml(user.email)}</td>
            <td>
                <span class="role-badge ${getRoleBadgeClass(user.role)}">
                    ${getRoleLabel(user.role)}
                </span>
            </td>
            <td>${formatDateTime(user.created_at)}</td>
            <td>
                <div class="table-actions">
                    <button class="btn-icon delete" onclick="openDeleteModal(${user.id}, '${escapeHtml(user.nom)}')" title="Supprimer">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="3 6 5 6 21 6"/>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                        </svg>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

/**
 * Filter users
 */
function filterUsers() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const roleFilter = document.getElementById('filterRole').value;

    const filtered = users.filter(user => {
        const matchesSearch = user.nom.toLowerCase().includes(searchTerm) ||
            user.email.toLowerCase().includes(searchTerm);
        const matchesRole = !roleFilter || user.role === roleFilter;

        return matchesSearch && matchesRole;
    });

    displayUsers(filtered);
}

/**
 * Open add user modal
 */
function openAddUserModal() {
    currentUserId = null;
    document.getElementById('modalTitle').textContent = 'Nouvel utilisateur';
    document.getElementById('btnSubmitText').textContent = 'Créer l\'utilisateur';
    document.getElementById('userForm').reset();
    document.getElementById('userModal').style.display = 'flex';
}

/**
 * Close user modal
 */
function closeUserModal() {
    document.getElementById('userModal').style.display = 'none';
    document.getElementById('userForm').reset();
    currentUserId = null;
}

/**
 * Toggle enseignant fields
 */
function toggleEnseignantFields() {
    const role = document.getElementById('role').value;
    const enseignantFields = document.getElementById('enseignantFields');

    if (role === 'ENSEIGNANT') {
        enseignantFields.style.display = 'block';
    } else {
        enseignantFields.style.display = 'none';
    }
}

/**
 * Handle form submission
 */
async function handleSubmit(e) {
    e.preventDefault();

    const formData = {
        nom: document.getElementById('nom').value,
        email: document.getElementById('emailUser').value,
        motDePasse: document.getElementById('motDePasse').value,
        role: document.getElementById('role').value
    };

    // Add enseignant fields if applicable
    if (formData.role === 'ENSEIGNANT') {
        formData.grade = document.getElementById('grade').value;
        formData.specialite = document.getElementById('specialite').value;
    }

    try {
        await API.users.create(formData);
        closeUserModal();
        await loadUsers();
        showNotification('Utilisateur créé avec succès', 'success');
    } catch (error) {
        const errorMessage = handleApiError(error, 'Erreur lors de la création');
        showNotification(errorMessage, 'error');
    }
}

/**
 * Open delete modal
 */
function openDeleteModal(userId, userName) {
    currentUserId = userId;
    document.getElementById('deleteUserName').textContent = userName;
    document.getElementById('deleteModal').style.display = 'flex';
}

/**
 * Close delete modal
 */
function closeDeleteModal() {
    document.getElementById('deleteModal').style.display = 'none';
    currentUserId = null;
}

/**
 * Confirm delete
 */
async function confirmDelete() {
    if (!currentUserId) return;

    try {
        await API.users.delete(currentUserId);
        closeDeleteModal();
        await loadUsers();
        showNotification('Utilisateur supprimé avec succès', 'success');
    } catch (error) {
        const errorMessage = handleApiError(error, 'Erreur lors de la suppression');
        showNotification(errorMessage, 'error');
    }
}

/**
 * Utility functions
 */

function getRoleBadgeClass(role) {
    const classes = {
        'CHEF_DEPARTEMENT': 'chef',
        'ENSEIGNANT': 'enseignant',
        'SECRETAIRE': 'secretaire'
    };
    return classes[role] || '';
}

function getRoleLabel(role) {
    const labels = {
        'CHEF_DEPARTEMENT': 'Chef de Département',
        'ENSEIGNANT': 'Enseignant',
        'SECRETAIRE': 'Secrétaire',
        'ETUDIANT': 'Étudiant'
    };
    return labels[role] || role;
}

function formatDateTime(dateString) {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });
}

function escapeHtml(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
}

function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm-1 15l-5-5 1.4-1.4 3.6 3.6 7.6-7.6L20 8l-9 9z"/>
        </svg>
        <span>${message}</span>
    `;

    // Style
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 1rem 1.5rem;
        background: ${type === 'success' ? '#48bb78' : '#f56565'};
        color: white;
        border-radius: 8px;
        box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
        display: flex;
        align-items: center;
        gap: 0.5rem;
        z-index: 9999;
        animation: slideIn 0.3s ease;
    `;

    document.body.appendChild(notification);

    // Remove after 3 seconds
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Add CSS animations
if (!document.getElementById('notification-styles')) {
    const style = document.createElement('style');
    style.id = 'notification-styles';
    style.textContent = `
        @keyframes slideIn {
            from {
                transform: translateX(100%);
                opacity: 0;
            }
            to {
                transform: translateX(0);
                opacity: 1;
            }
        }
        @keyframes slideOut {
            from {
                transform: translateX(0);
                opacity: 1;
            }
            to {
                transform: translateX(100%);
                opacity: 0;
            }
        }
    `;
    document.head.appendChild(style);
}
