/**
 * Logic Statistiques
 */

document.addEventListener('DOMContentLoaded', async () => {
    requireAuth();
    await loadStats();
});

async function loadStats() {
    try {
        const [seances, users] = await Promise.all([
            API.seances.getAll(),
            API.users.getAll()
        ]);

        const enseignants = users.filter(u => u.role === 'ENSEIGNANT');
        const stats = {};

        // Initialiser stats
        enseignants.forEach(e => {
            stats[e.id] = { nom: e.nom, cours: 0, td: 0, tp: 0, total: 0 };
        });

        let totalHeuresGlobal = 0;

        // Calculer heures
        seances.forEach(s => {
            if (!stats[s.enseignant_id]) return; // Enseignant supprimé ou inconnu

            const [startH, startM] = s.heure_debut.split(':').map(Number);
            const [endH, endM] = s.heure_fin.split(':').map(Number);
            const duration = (endH + endM / 60) - (startH + startM / 60);

            const type = s.type.toLowerCase(); // cours, td, tp
            if (stats[s.enseignant_id][type] !== undefined) {
                stats[s.enseignant_id][type] += duration;
                stats[s.enseignant_id].total += duration;
                totalHeuresGlobal += duration;
            }
        });

        // Afficher totaux
        document.getElementById('totalHours').textContent = Math.round(totalHeuresGlobal);
        // Taux occupation simulé (ex: basé sur 5 salles * 40h/semaine * 4 semaines)
        const capacityTheorique = 5 * 40 * 4;
        const rate = Math.min(100, Math.round((totalHeuresGlobal / capacityTheorique) * 100));
        document.getElementById('occupancyRate').textContent = `${rate}%`;

        // Afficher tableau
        const tbody = document.getElementById('hoursTableBody');
        tbody.innerHTML = Object.values(stats)
            .sort((a, b) => b.total - a.total)
            .map(s => `
                <tr>
                    <td><strong>${escapeHtml(s.nom)}</strong></td>
                    <td>${s.cours.toFixed(1)}</td>
                    <td>${s.td.toFixed(1)}</td>
                    <td>${s.tp.toFixed(1)}</td>
                    <td><strong>${s.total.toFixed(1)}</strong></td>
                </tr>
            `).join('');

    } catch (e) {
        console.error('Erreur stats', e);
    }
}

function escapeHtml(text) {
    return text ? text.replace(/</g, "&lt;") : '';
}
