const app = require('./src/app');
const pool = require('./src/config/db');

const PORT = process.env.PORT || 3000;

(async () => {
  try {
    await pool.query('SELECT 1');
    console.log('✅ Connexion MySQL réussie');

    app.listen(PORT, () => {
      console.log(`✅ Serveur lancé sur http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('❌ Erreur connexion MySQL:', error);
  }
})();
