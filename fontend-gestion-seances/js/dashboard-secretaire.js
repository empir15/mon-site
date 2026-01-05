/**
 * Logic Dashboard Secrétaire
 */

document.addEventListener('DOMContentLoaded', async () => {
    const user = requireAuth();
    if (!user || user.role !== 'SECRETAIRE') {
        alert('Accès non autorisé');
        logout();
        return;
    }

    // Log pour debug
    console.log('USER CONNECTÉ (Secrétaire) :', user);

    const userName = document.getElementById('userName');
    if (userName) userName.textContent = user.nom;

    // Date
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const currentDate = document.getElementById('currentDate');
    if (currentDate) {
        currentDate.textContent = new Date().toLocaleDateString('fr-FR', options);
    }

    await loadData();
});

async function loadData() {
    try {
        console.log('🔄 Chargement données secrétaire');

        const [salles, seances] = await Promise.all([
            API.salles.getAll(),
            API.seances.getAll()
        ]);

        // Stats
        const sallesCountElem = document.getElementById('statsSallesCount');
        if (sallesCountElem) sallesCountElem.textContent = salles.length || 0;

        const today = new Date().toISOString().split('T')[0];
        const todaysSeances = seances.filter(s => s.date === today);
        const seancesTodayElem = document.getElementById('statsSeancesToday');
        if (seancesTodayElem) seancesTodayElem.textContent = todaysSeances.length || 0;

        // Tableau Occupation
        const tbody = document.getElementById('occupationTable');
        if (!tbody) return;

        if (salles.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4" style="text-align:center">Aucune salle</td></tr>';
            return;
        }

        tbody.innerHTML = salles.map(salle => {
            const count = todaysSeances.filter(s => s.salle_id === salle.id).length;
            const status = count > 0 ? 'Occupée' : 'Libre';
            const statusClass = count > 0 ? 'warning' : 'success';

            return `
                <tr>
                    <td><strong>${escapeHtml(salle.nom)}</strong></td>
                    <td>${salle.capacite}</td>
                    <td>${count} cours</td>
                    <td><span class="status-badge status-${statusClass}">${status}</span></td>
                </tr>
            `;
        }).join('');

        console.log('✅ Données chargée :', salles.length, 'salles,', todaysSeances.length, 'séances aujourd\'hui');

    } catch (error) {
        console.error('❌ Erreur chargement secrétaire:', error);
        const tbody = document.getElementById('occupationTable');
        if (tbody) {
            tbody.innerHTML = '<tr><td colspan="4" style="text-align:center; color: red;">Erreur de chargement</td></tr>';
        }
    }
}

function escapeHtml(text) {
    return text ? text.replace(/</g, "&lt;") : '';
}