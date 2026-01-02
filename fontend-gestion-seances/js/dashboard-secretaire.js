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

    document.getElementById('userName').textContent = user.nom;

    // Date
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    document.getElementById('currentDate').textContent = new Date().toLocaleDateString('fr-FR', options);

    await loadData();
});

async function loadData() {
    try {
        const [salles, seances] = await Promise.all([
            API.salles.getAll(),
            API.seances.getAll()
        ]);

        // Stats
        document.getElementById('statsSallesCount').textContent = salles.length;

        const today = new Date().toISOString().split('T')[0];
        const todaysSeances = seances.filter(s => s.date === today);
        document.getElementById('statsSeancesToday').textContent = todaysSeances.length;

        // Tableau Occupation
        const tbody = document.getElementById('occupationTable');

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

    } catch (error) {
        console.error('Erreur chargement:', error);
    }
}

function escapeHtml(text) {
    return text ? text.replace(/</g, "&lt;") : '';
}
