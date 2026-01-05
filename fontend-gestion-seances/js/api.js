/**
 * API Helper - Gestion des appels API vers le backend
 */

const API_BASE_URL = 'http://127.0.0.1:3000/api';  // Force 3000, pas 8080 !
console.log('🔧 API_BASE_URL configurée à :', API_BASE_URL);  // Log pour debug - enlève-le après test

/**
 * Wrapper pour les requêtes fetch avec gestion d'erreurs
 */
async function apiRequest(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    console.log('📡 Appel API vers :', url, 'Méthode:', options.method || 'GET');

    // Configuration par défaut
    const config = {
        headers: {
            'Content-Type': 'application/json',
            ...options.headers
        },
        ...options
    };

    // Ajouter le token JWT si disponible
    const token =
        localStorage.getItem('token') ||
        sessionStorage.getItem('token');

    if (token) {
        config.headers['Authorization'] = `Bearer ${token}`;
    }

    try {
        const response = await fetch(url, config);

        // Gérer les erreurs HTTP
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || `Erreur HTTP: ${response.status}`);
        }

        // Retourner la réponse JSON
        const data = await response.json();

        console.log('Login Response:', data); // DEBUG

        return data;
    } catch (error) {
        console.error('API Request Error:', error);

        // Erreur de connexion (serveur éteint ou inaccessible)
        if (error.name === 'TypeError' && error.message === 'Failed to fetch') {
            throw new Error('Impossible de contacter le serveur. Vérifiez que le backend est démarré (port 3000).');
        }

        throw error;
    }
}

/**
 * API Endpoints
 */
const API = {
    // ========== AUTH ==========
    auth: {
        login: (email, motDePasse) =>
            apiRequest('/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },  // Force pour éviter 405
                body: JSON.stringify({ email, motDePasse })
            })
    },

    // ========== USERS ==========
    users: {
        getAll: () => apiRequest('/users'),
        create: (userData) =>
            apiRequest('/users', {
                method: 'POST',
                body: JSON.stringify(userData)
            }),
        delete: (id) =>
            apiRequest(`/users/${id}`, {
                method: 'DELETE'
            })
    },

    // ========== SALLES ==========
    salles: {
        getAll: () => apiRequest('/salles'),
        create: (salleData) =>
            apiRequest('/salles', {
                method: 'POST',
                body: JSON.stringify(salleData)
            }),
        update: (id, salleData) =>
            apiRequest(`/salles/${id}`, {
                method: 'PUT',
                body: JSON.stringify(salleData)
            }),
        delete: (id) =>
            apiRequest(`/salles/${id}`, {
                method: 'DELETE'
            })
    },

    // ========== SEANCES ==========
    seances: {
        getAll: (filters = {}) => {
            const params = new URLSearchParams(filters);
            const query = params.toString() ? `?${params.toString()}` : '';
            return apiRequest(`/seances${query}`);
        },
        create: (seanceData) =>
            apiRequest('/seances', {
                method: 'POST',
                body: JSON.stringify(seanceData)
            }),
        update: (id, seanceData) =>
            apiRequest(`/seances/${id}`, {
                method: 'PUT',
                body: JSON.stringify(seanceData)
            }),
        delete: (id) =>
            apiRequest(`/seances/${id}`, {
                method: 'DELETE'
            })
    }
};

/**
 * Gérer les erreurs API de manière centralisée
 */
function handleApiError(error, defaultMessage = 'Une erreur est survenue') {
    console.error('API Error:', error);

    // Vérifier si c'est une erreur d'authentification
    if (error.message.includes('401') || error.message.includes('Token')) {
        // Déconnecter l'utilisateur
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = 'login.html';
        return 'Session expirée. Veuillez vous reconnecter.';
    }

    return error.message || defaultMessage;
}

// Exporter pour utilisation globale
window.API = API;
window.handleApiError = handleApiError;
