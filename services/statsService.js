// services/statsService.js
const pool = require('./db');
const botDbService = require('./botDbService');
const baileysManager = require('./baileysManager');

const QUALIFIED_SCORE_THRESHOLD = Number(process.env.QUALIFIED_SCORE_THRESHOLD || 70);

let _columnCache = {
  checked: false,
  hasIsQualified: false,
  hasScore: false,
};

async function detectLeadColumns() {
  const res = await pool.query(
    `
    SELECT column_name
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'leads'
      AND column_name IN ('is_qualified', 'score')
    `
  );

  const cols = new Set(res.rows.map(r => r.column_name));
  _columnCache = {
    checked: true,
    hasIsQualified: cols.has('is_qualified'),
    hasScore: cols.has('score'),
  };
}

/**
 * Devuelve métricas de dashboard para el owner (admin logueado)
 */
async function getDashboardStats(ownerEmail) {
  if (!_columnCache.checked) {
    await detectLeadColumns();
  }

  // 1) Bots del owner
  const allBots = await botDbService.getAllBots();
  const bots = allBots.filter(b => (b.owneremail ?? b.ownerEmail) === ownerEmail);
  const botIds = bots.map(b => b.id);

  let botsConnected = 0;
  let botsDisconnected = 0;

  bots.forEach(bot => {
    const status = baileysManager.getBotStatus(bot.id);
    if (status === 'CONNECTED') botsConnected += 1;
    else botsDisconnected += 1;
  });

  if (botIds.length === 0) {
    return {
      botsTotal: 0,
      botsConnected: 0,
      botsDisconnected: 0,
      totalLeads: 0,
      qualifiedLeads: 0,
      newLeadsToday: 0,
    };
  }

  // 2) Leads totales
  const totalLeadsRes = await pool.query(
    `SELECT COUNT(*)::int AS count
     FROM leads
     WHERE bot_id = ANY($1::text[])`,
    [botIds]
  );

  // 3) Leads calificados (depende del esquema real)
  let qualifiedLeadsCount = 0;

  if (_columnCache.hasIsQualified) {
    const qualifiedLeadsRes = await pool.query(
      `SELECT COUNT(*)::int AS count
       FROM leads
       WHERE bot_id = ANY($1::text[])
         AND is_qualified = TRUE`,
      [botIds]
    );
    qualifiedLeadsCount = qualifiedLeadsRes.rows[0]?.count || 0;
  } else if (_columnCache.hasScore) {
    const qualifiedLeadsRes = await pool.query(
      `SELECT COUNT(*)::int AS count
       FROM leads
       WHERE bot_id = ANY($1::text[])
         AND COALESCE(score, 0) >= $2`,
      [botIds, QUALIFIED_SCORE_THRESHOLD]
    );
    qualifiedLeadsCount = qualifiedLeadsRes.rows[0]?.count || 0;
  } else {
    qualifiedLeadsCount = 0;
  }

  // 4) Leads creados hoy
  const todayLeadsRes = await pool.query(
    `SELECT COUNT(*)::int AS count
     FROM leads
     WHERE bot_id = ANY($1::text[])
       AND created_at::date = CURRENT_DATE`,
    [botIds]
  );

  return {
    botsTotal: bots.length,
    botsConnected,
    botsDisconnected,
    totalLeads: totalLeadsRes.rows[0]?.count || 0,
    qualifiedLeads: qualifiedLeadsCount,
    newLeadsToday: todayLeadsRes.rows[0]?.count || 0,
  };
}

module.exports = { getDashboardStats };