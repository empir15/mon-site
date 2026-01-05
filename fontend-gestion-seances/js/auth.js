/**
 * Authentication Logic - Page de connexion
 */

// Attendre que le DOM soit chargé
document.addEventListener('DOMContentLoaded', () => {
    // Vérifier si l'utilisateur est déjà connecté
    checkExistingSession();

    // Gérer la soumission du formulaire
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }

    // Gérer le toggle du mot de passe
    const togglePassword = document.getElementById('togglePassword');
    if (togglePassword) {
        togglePassword.addEventListener('click', togglePasswordVisibility);
    }
});

/**
 * Vérifier si une session existe déjà
 */
function checkExistingSession() {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');

    if (token && user) {
        try {
            const userData = JSON.parse(user);
            redirectToDashboard(userData.role);
        } catch (error) {
            // Token invalide, nettoyer
            localStorage.removeItem('token');
            localStorage.removeItem('user');
        }
    }
}

/**
 * Gérer la connexion
 */
async function handleLogin(event) {
    event.preventDefault();

    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    const remember = document.getElementById('remember').checked;

    // Validation basique
    if (!email || !password) {
        showAlert('Veuillez remplir tous les champs', 'error');
        return;
    }

    // Afficher le loading
    showLoading(true);
    hideAlert();

    try {
        // Appeler l'API de login
        const response = await API.auth.login(email, password);

        // Sauvegarder le token et les infos utilisateur
        const storage = remember ? localStorage : sessionStorage;

        storage.setItem('token', response.token);

        // La réponse backend est { token, user: { ... } }
        // Si l'API retourne directement le user à la racine (ancienne version), on gère les deux cas
        const userData = response.user || response;

        storage.setItem('user', JSON.stringify({
            id: userData.id,
            nom: userData.nom,
            email: userData.email || email,
            role: userData.role
        }));

        // Rediriger vers le dashboard approprié
        const role = userData.role;


        // Afficher succès
        showAlert('Connexion réussie ! Redirection...', 'success');

        // Rediriger vers le dashboard approprié
        setTimeout(() => {
            redirectToDashboard(role);
        }, 1000);

    } catch (error) {
        showLoading(false);
        const errorMessage = handleApiError(error, 'Email ou mot de passe incorrect');
        showAlert(errorMessage, 'error');
    }
}

/**
 * Rediriger vers le bon dashboard selon le rôle
 */
function redirectToDashboard(role) {
    const dashboards = {
        'CHEF_DEPARTEMENT': 'pages/chef/dashboard.html',
        'ENSEIGNANT': 'pages/enseignant/dashboard.html',
        'SECRETAIRE': 'pages/secretaire/dashboard.html',
        'ETUDIANT': 'pages/etudiant/dashboard.html'
    };

    const dashboardUrl = dashboards[role] || 'pages/chef/dashboard.html';
    window.location.href = dashboardUrl;
}

/**
 * Toggle visibilité du mot de passe
 */
function togglePasswordVisibility() {
    const passwordInput = document.getElementById('password');
    const eyeIcon = document.querySelector('.eye-icon');

    if (passwordInput.type === 'password') {
        passwordInput.type = 'text';
        eyeIcon.innerHTML = `
            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
            <line x1="1" y1="1" x2="23" y2="23"/>
        `;
    } else {
        passwordInput.type = 'password';
        eyeIcon.innerHTML = `
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
            <circle cx="12" cy="12" r="3"/>
        `;
    }
}

/**
 * Afficher/masquer le loading overlay
 */
function showLoading(show) {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) {
        overlay.style.display = show ? 'flex' : 'none';
    }
}

/**
 * Afficher un message d'alerte
 */
function showAlert(message, type = 'error') {
    const alertElement = document.getElementById('alertMessage');
    const alertText = document.getElementById('alertText');

    if (alertElement && alertText) {
        alertText.textContent = message;
        alertElement.className = `alert ${type}`;
        alertElement.style.display = 'flex';

        // Auto-hide après 5 secondes
        setTimeout(() => {
            hideAlert();
        }, 5000);
    }
}

/**
 * Masquer l'alerte
 */
function hideAlert() {
    const alertElement = document.getElementById('alertMessage');
    if (alertElement) {
        alertElement.style.display = 'none';
    }
}

/**
 * Fonction de déconnexion (utilisée dans toutes les pages)
 */
function logout() {
    localStorage.clear();
    sessionStorage.clear();

    window.location.href = '../../login.html';
}

/**
 * Vérifier l'authentification sur les pages protégées
 */
function requireAuth() {
    const token =
        localStorage.getItem('token') ||
        sessionStorage.getItem('token');

    const user =
        localStorage.getItem('user') ||
        sessionStorage.getItem('user');


    if (!token || !user) {
        window.location.href = '../../login.html';
        return null;
    }

    try {
        return JSON.parse(user);
    } catch (error) {
        logout();
        return null;
    }
}

/**
 * Obtenir les informations de l'utilisateur connecté
 */
function getCurrentUser() {
    const user = localStorage.getItem('user');
    if (user) {
        try {
            return JSON.parse(user);
        } catch (error) {
            return null;
        }
    }
    return null;
}

// Exporter pour utilisation globale
window.logout = logout;
window.requireAuth = requireAuth;
window.getCurrentUser = getCurrentUser;
